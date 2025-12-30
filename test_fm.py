import sys
sys.path.insert(0, 'scripts')
from parse_pdf import parse_pdf, parse_solutions

q = parse_pdf('2018-10-exam-fm-sample-questions.pdf')
a = parse_solutions('2018-10-exam-fm-sample-solutions.pdf')

print(f'Questions: {len(q)}, Answers: {len(a)}')
print('First 10 answers:', dict(list(a.items())[:10]))
print('\nFirst 5 questions:')
for i in range(min(5, len(q))):
    content = q[i]['content'][:60] if q[i]['content'] else 'EMPTY'
    correct = a.get(q[i]['id'], 'N/A')
    opts = len(q[i]['options'])
    print(f"  Q{q[i]['id']}: {content}... | Answer: {correct} | Options: {opts}")
