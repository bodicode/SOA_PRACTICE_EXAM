import Script from 'next/script'

export default function StructuredData() {
    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "SOA Exam Practice",
        "description": "Nền tảng luyện thi SOA Actuarial hàng đầu Việt Nam",
        "url": process.env.NEXT_PUBLIC_SITE_URL || "https://3hours.io.vn",
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${process.env.NEXT_PUBLIC_SITE_URL || "https://3hours.io.vn"}/practice?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
        }
    }

    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "name": "SOA Exam Practice",
        "description": "Nền tảng luyện thi SOA Actuarial chuyên nghiệp",
        "url": process.env.NEXT_PUBLIC_SITE_URL || "https://3hours.io.vn",
        "logo": `${process.env.NEXT_PUBLIC_SITE_URL || "https://3hours.io.vn"}/logo-light-theme.png`,
        "sameAs": [
            // Add your social media links here
        ]
    }

    const examCoursesSchema = [
        {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "Luyện thi SOA Exam P (Probability)",
            "description": "Kho đề thi và tài liệu luyện thi SOA Exam P Probability chính hãng, cập nhật Syllabus 2026.",
            "provider": {
                "@type": "Organization",
                "name": "SOA Exam Practice",
                "sameAs": process.env.NEXT_PUBLIC_SITE_URL || "https://3hours.io.vn"
            },
            "courseCode": "SOA-P",
            "educationalLevel": "Professional",
            "inLanguage": "vi"
        },
        {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "Luyện thi SOA Exam FM (Financial Mathematics)",
            "description": "Chương trình ôn luyện SOA Exam FM Financial Mathematics với ngân hàng câu hỏi thích ứng.",
            "provider": {
                "@type": "Organization",
                "name": "SOA Exam Practice",
                "sameAs": process.env.NEXT_PUBLIC_SITE_URL || "https://3hours.io.vn"
            },
            "courseCode": "SOA-FM",
            "educationalLevel": "Professional",
            "inLanguage": "vi"
        }
    ]

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "SOA là gì và chứng chỉ này dành cho ai?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "SOA (Society of Actuaries) là Hiệp hội Định phí Hoa Kỳ. Các kỳ thi SOA (như Exam P, FM) là bước khởi đầu bắt buộc để trở thành chuyên gia định phí (Actuary) - một trong những nghề nghiệp có thu nhập cao nhất thế giới."
                }
            },
            {
                "@type": "Question",
                "name": "Tôi nên bắt đầu luyện thi SOA từ Exam nào?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Hầu hết ứng viên bắt đầu với Exam P (Probability) hoặc Exam FM (Financial Mathematics). Đây là hai kỳ thi nền tảng quan trọng nhất."
                }
            },
            {
                "@type": "Question",
                "name": "Học phí và lệ phí thi SOA là bao nhiêu?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Lệ phí thi chính thức của SOA thường dao động từ $250 - $350/exam. Tại SOA Exam Practice, chúng tôi cung cấp giải pháp luyện thi với chi phí tối ưu."
                }
            },
        ]
    }

    return (
        <>
            <Script
                id="website-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(websiteSchema)
                }}
            />
            <Script
                id="organization-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(organizationSchema)
                }}
            />
            {examCoursesSchema.map((schema, index) => (
                <Script
                    key={`course-schema-${index}`}
                    id={`course-schema-${index}`}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(schema)
                    }}
                />
            ))}
            <Script
                id="faq-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(faqSchema)
                }}
            />
        </>
    )
}
