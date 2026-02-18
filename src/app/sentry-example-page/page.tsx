"use client";

export default function SentryExamplePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Sentry Error Test</h1>
            <p className="mb-8">Click the button below to trigger a test error.</p>
            <button
                type="button"
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                onClick={() => {
                    throw new Error("Sentry Test Error from /sentry-example-page");
                }}
            >
                Throw Test Error
            </button>
        </div>
    );
}
