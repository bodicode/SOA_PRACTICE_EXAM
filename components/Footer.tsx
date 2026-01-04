import Link from 'next/link'

export function Footer() {
    return (
        <footer className="py-12 border-t border-gray-100 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm font-bold">S</span>
                        </div>
                        <span className="font-bold text-gray-900">SOA Prep</span>
                    </div>
                    <nav className="flex flex-wrap justify-center gap-8 text-sm font-medium text-gray-600">
                        <Link href="/support" className="hover:text-blue-600 transition-colors">Hỗ Trợ</Link>
                        <Link href="/exams" className="hover:text-blue-600 transition-colors">Danh Mục Đề Thi</Link>
                        <Link href="/terms" className="hover:text-blue-600 transition-colors">Điều Khoản</Link>
                        <Link href="/privacy" className="hover:text-blue-600 transition-colors">Bảo Mật</Link>
                    </nav>
                    <div className="text-sm text-gray-500">
                        © 2024 SOA Prep. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    )
}
