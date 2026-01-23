import Script from 'next/script'

export default function StructuredData() {
    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "SOA Exam Practice",
        "description": "Nền tảng luyện thi SOA Actuarial hàng đầu Việt Nam",
        "url": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/practice?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
        }
    }

    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "name": "SOA Exam Practice",
        "description": "Nền tảng luyện thi SOA Actuarial chuyên nghiệp",
        "url": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "logo": `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/logo.png`,
        "sameAs": [
            // Add your social media links here
        ]
    }

    const educationalCourseSchema = {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": "SOA Actuarial Exam Preparation",
        "description": "Comprehensive practice questions and mock exams for SOA actuarial certification",
        "provider": {
            "@type": "Organization",
            "name": "SOA Exam Practice",
            "sameAs": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
        },
        "educationalLevel": "Professional",
        "inLanguage": "vi"
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
            <Script
                id="course-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(educationalCourseSchema)
                }}
            />
        </>
    )
}
