
import sys
import json
import re
import pdfplumber

def table_to_markdown(table):
    if not table:
        return ""
    
    # Filter out None values
    cleaned_table = [[str(cell) if cell is not None else "" for cell in row] for row in table]
    
    if not cleaned_table:
        return ""

    # Check if cells contain multiple values that should be separate rows
    # This happens when pdfplumber merges rows incorrectly
    fixed_table = []
    
    for row_idx, row in enumerate(cleaned_table):
        # Check if any cell in this row has multiple lines or space-separated values
        # that might indicate merged rows
        max_splits = 1
        split_candidates = []
        
        for cell in row:
            # Split by newline first, then check for space-separated numeric patterns
            lines = cell.strip().split('\n') if cell else ['']
            if len(lines) > 1:
                max_splits = max(max_splits, len(lines))
                split_candidates.append(lines)
            else:
                # Check for space-separated values (common in merged cells)
                # Only split if they look like data values (numbers, age ranges, etc.)
                parts = cell.split() if cell else ['']
                # If multiple parts and they look like values (not a sentence)
                if len(parts) > 1 and len(parts) == max(len(c.split()) for c in row if c):
                    is_data_row = all(
                        any(char.isdigit() for char in p) or len(p) < 8 
                        for p in parts
                    )
                    if is_data_row and row_idx > 0:  # Don't split header row
                        max_splits = max(max_splits, len(parts))
                        split_candidates.append(parts)
                    else:
                        split_candidates.append([cell])
                else:
                    split_candidates.append([cell])
        
        # If we need to split this row
        if max_splits > 1:
            for i in range(max_splits):
                new_row = []
                for candidates in split_candidates:
                    if i < len(candidates):
                        new_row.append(candidates[i])
                    else:
                        new_row.append('')
                fixed_table.append(new_row)
        else:
            fixed_table.append(row)
    
    if not fixed_table:
        return ""

    # Build markdown table
    md = ""
    # Headers
    headers = fixed_table[0]
    md += "| " + " | ".join(headers) + " |\n"
    md += "| " + " | ".join(["---"] * len(headers)) + " |\n"
    
    # Rows
    for row in fixed_table[1:]:
        # Ensure row has same number of columns as header
        while len(row) < len(headers):
            row.append('')
        md += "| " + " | ".join(row[:len(headers)]) + " |\n"
    
    return md + "\n"


def parse_pdf(file_path):
    questions = []
    
    # Regex patterns
    # Match both formats: "1. text" (Exam P) and "1." on its own (Exam FM)
    question_start_pattern = re.compile(r'^(\d+)\.\s*(.*)')
    option_pattern = re.compile(r'(?:^|\s)(?:\(([A-E])\)|\b([A-E])\.|\b([A-E])\))')
    footer_pattern = re.compile(r'Page\s+\d+\s+of\s+\d+', re.IGNORECASE)

    current_question = None
    next_id = 1
    
    try:
        with pdfplumber.open(file_path) as pdf:
            full_text = ""
            for page in pdf.pages:
                # Find tables
                tables = page.find_tables()
                # Sort by top y
                tables.sort(key=lambda t: t.bbox[1])
                
                current_y = 0
                page_height = page.height
                page_width = page.width
                
                # Check for tables and interleave text
                if tables:
                    for table_obj in tables:
                        t_top = table_obj.bbox[1]
                        t_bottom = table_obj.bbox[3]
                        
                        # Extract text above table
                        # Margin of error for floating point
                        if t_top > current_y + 1: 
                            bbox = (0, current_y, page_width, t_top)
                            try:
                                cropped = page.crop(bbox)
                                text = cropped.extract_text()
                                if text: full_text += text + "\n"
                            except Exception:
                                pass # formatting error or empty crop
                        
                        # Extract tableContent
                        try:
                            table_data = table_obj.extract()
                            full_text += "\n" + table_to_markdown(table_data) + "\n"
                        except Exception:
                            pass
                        
                        current_y = t_bottom
                    
                    # Bottom of page
                    if current_y < page_height - 1:
                        bbox = (0, current_y, page_width, page_height)
                        try:
                            cropped = page.crop(bbox)
                            text = cropped.extract_text()
                            if text: full_text += text + "\n"
                        except Exception:
                            pass
                else:
                    # No tables, just extract text
                    text = page.extract_text()
                    if text: full_text += text + "\n"
            
            # Pre-processing text
            lines = full_text.split('\n')
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Skip footers
                if footer_pattern.search(line):
                    continue

                # Check for Question Start
                q_match = question_start_pattern.match(line)
                if q_match:
                    if current_question:
                        # Save previous question (even without options)
                        questions.append(current_question)

                    # Use the actual question number from PDF for matching with answers
                    pdf_question_id = int(q_match.group(1))
                    initial_content = q_match.group(2).strip() if q_match.group(2) else ""
                    
                    current_question = {
                        "id": pdf_question_id,  # Use PDF's original number
                        "content": initial_content,
                        "options": [],
                        "correctOption": "A"
                    }
                    next_id = pdf_question_id + 1  # Track for fallback
                    continue

                # Check for Options (Standard)
                if current_question:
                    # If line starts with pipe |, it's likely a table row
                    # Add it to content and continue, don't parse options inside table
                    if line.startswith('|'):
                         if current_question['options']:
                              # If we have options already, adding a table might be weird?
                              # Usually table is part of Question Content.
                              # If options started, maybe this table is part of Option explanation?
                              # For now, append to wherever we are.
                              current_question['options'][-1]['text'] += "\n" + line
                         else:
                              current_question['content'] += "\n" + line
                         continue

                    # Normal Option logic
                    search_line = " " + line
                    matches = list(option_pattern.finditer(search_line))
                    
                    valid_matches = []
                    existing_keys = set(o['key'] for o in current_question['options'])
                    for m in matches:
                        key = m.group(1) or m.group(2) or m.group(3)
                        if key not in existing_keys:
                            valid_matches.append(m)
                            existing_keys.add(key)
                    matches = valid_matches
                    
                    if matches:
                        last_idx = 0
                        for i, match in enumerate(matches):
                            start, end = match.span()
                            key = match.group(1) or match.group(2) or match.group(3)
                            pre_text = search_line[last_idx:start].strip()
                            
                            if i == 0:
                                if pre_text:
                                    if current_question['options']:
                                         current_question['options'][-1]['text'] += " " + pre_text
                                    else:
                                         current_question['content'] += " " + pre_text
                            else:
                                if current_question['options']:
                                    current_question['options'][-1]['text'] += " " + pre_text
                            
                            current_question['options'].append({
                                "key": key,
                                "text": "" 
                            })
                            last_idx = end
                        
                        remaining_text = search_line[last_idx:].strip()
                        if current_question['options']:
                            current_question['options'][-1]['text'] += " " + remaining_text
                            
                    else:
                        # No option markers. Append line to current context
                        # Check for Roman numeral lists like (i), (ii), (iii)
                        # Add newline before them for proper formatting
                        roman_pattern = r'(\([ivxlcdm]+\))'
                        formatted_line = re.sub(roman_pattern, r'\n\1', line, flags=re.IGNORECASE)
                        
                        if current_question['options']:
                            current_question['options'][-1]['text'] += " " + formatted_line
                        else:
                            current_question['content'] += " " + formatted_line

            # Append last question (even without options)
            if current_question:
                questions.append(current_question)

            return questions

    except Exception as e:
        raise e


def parse_solutions(file_path):
    """Parse solution PDF to extract answer key.
    Returns dict: {question_number: correct_answer}
    Example: {1: "D", 2: "A", ...}
    """
    answers = {}
    
    # Pattern: "1. Solution: D" or "Question 1 Solution: D"
    solution_pattern = re.compile(r'^(\d+)\.\s*Solution:\s*([A-E])', re.IGNORECASE)
    
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if not text:
                    continue
                    
                lines = text.split('\n')
                for line in lines:
                    line = line.strip()
                    match = solution_pattern.match(line)
                    if match:
                        q_num = int(match.group(1))
                        answer = match.group(2).upper()
                        answers[q_num] = answer
                        
        return answers
        
    except Exception as e:
        raise e


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No file path provided"}))
        return
    
    question_file = sys.argv[1]
    solution_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    try:
        # Parse questions
        questions = parse_pdf(question_file)
        
        # If solution file provided, parse and match answers
        if solution_file:
            answers = parse_solutions(solution_file)
            
            # Match answers to questions by their original PDF number
            # Questions are numbered sequentially (1, 2, 3...) in our output
            for q in questions:
                q_id = q['id']  # This is the sequential ID we assigned
                if q_id in answers:
                    q['correctOption'] = answers[q_id]
        
        print(json.dumps({
            "success": True, 
            "count": len(questions), 
            "questions": questions
        }))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))


if __name__ == "__main__":
    main()

