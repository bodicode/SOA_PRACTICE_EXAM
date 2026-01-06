"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const TabsContext = React.createContext<{
    value: string;
    onChange: (v: string) => void;
} | null>(null);

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
}

function Tabs({
    defaultValue,
    value: controlledValue,
    onValueChange,
    className,
    children,
    ...props
}: TabsProps) {
    const [internalValue, setInternalValue] = React.useState(defaultValue || "");

    const value = controlledValue !== undefined ? controlledValue : internalValue;
    const onChange = (v: string) => {
        if (onValueChange) {
            onValueChange(v);
        }
        if (controlledValue === undefined) {
            setInternalValue(v);
        }
    };

    return (
        <TabsContext.Provider value={{ value, onChange }}>
            <div className={cn("", className)} {...props}>
                {children}
            </div>
        </TabsContext.Provider>
    )
}

function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
                className
            )}
            {...props}
        />
    )
}

function TabsTrigger({
    className,
    value,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
    const context = React.useContext(TabsContext);
    const isActive = context?.value === value;
    return (
        <button
            type="button"
            onClick={() => context?.onChange(value)}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isActive ? "bg-white shadow text-black" : "hover:bg-gray-200 text-gray-500",
                className
            )}
            {...props}
        />
    )
}

function TabsContent({
    className,
    value,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
    const context = React.useContext(TabsContext);
    if (context?.value !== value) return null;
    return (
        <div
            className={cn(
                "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
