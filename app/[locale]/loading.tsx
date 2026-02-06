
import { Loader } from "@/components/ui/loader"

export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader size="lg" />
        </div>
    )
}
