"use client";

import { useRef, useState } from "react";

interface Props {
    value: string;
    onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: Props) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [loading, setLoading] = useState(false);

    const handleUpload = async (file: File) => {
        try {
            setLoading(true);

            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (data.url) {
                onChange(data.url);
            }
        } catch (err) {
            console.error(err);
            alert("Upload failed");
        } finally {
            setLoading(false);
        }
    };

    if (value) {
        return (
            <div className="relative w-40 h-40">
                <img
                    src={value}
                    className="w-40 h-40 object-cover rounded-md"
                />
                <button
                    onClick={() => onChange("")}
                    className="absolute top-0 right-0 bg-red-500 text-white px-2"
                >
                    X
                </button>
            </div>
        );
    }

    return (
        <div>
            <input
                type="file"
                hidden
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                }}
            />

            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded"
            >
                {loading ? "Uploading..." : "Choose Image"}
            </button>
        </div>
    );
}