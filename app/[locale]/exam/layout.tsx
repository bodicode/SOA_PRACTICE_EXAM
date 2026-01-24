export default function ExamLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-white">
            {/* We intentionally omit the standard Navbar and Footer here 
            to create a focused, full-screen exam environment similar to CBT */}
            {children}
        </div>
    )
}
