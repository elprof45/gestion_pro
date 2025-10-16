'use client'
import React from 'react'
import { Button } from './button'
import { Spinner } from './spinner'

type ActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean
    children: React.ReactNode
    variant?: "ghost" | "outline" | "default" | "link" | "destructive" | "secondary" | null | undefined
    className?: string
    disabled?: boolean
    type?: "button" | "submit" | "reset" | undefined
}
export default function ActionButtonClient({
    loading = false,
    children,
    className = '',
    variant = 'default',
    disabled = false,
    type = 'button',
}: ActionButtonProps) {
    return (
        <Button type={type} variant={variant} disabled={disabled || loading} className={`${className}`}>
            {loading ? (
                <Spinner className="mr-2" />
            ) : null}
            <span className="flex items-center">
                {children}
            </span>
        </Button>
    )
}
