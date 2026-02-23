import { SignUp } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-black">
            <SignUp
                appearance={{
                    elements: {
                        formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-500 text-sm normal-case',
                        card: 'bg-slate-900 border border-white/10',
                        headerTitle: 'text-white',
                        headerSubtitle: 'text-slate-400',
                        socialButtonsBlockButton: 'bg-white/5 border-white/10 text-white hover:bg-white/10',
                        dividerLine: 'bg-white/10',
                        dividerText: 'text-slate-500',
                        formFieldLabel: 'text-slate-300',
                        formFieldInput: 'bg-white/5 border-white/10 text-white',
                        footerActionText: 'text-slate-400',
                        footerActionLink: 'text-indigo-400 hover:text-indigo-300'
                    }
                }}
            />
        </div>
    );
}
