import { Suspense } from "react";
import FaqClient from "./faq-client";

export default function Page({ params }: { params: { context: string } }) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Design on Stock Logo */}
      <div className="flex justify-center">
        <img 
          src="https://www.designonstock.com/img/logos/design-on-stock-logo.svg" 
          alt="Design on Stock" 
          className="h-18 w-auto -ml-[480px]"
        />
      </div>
      <main className="flex-1 mx-auto w-full max-w-[620px] px-4 py-12 sm:px-0">
        <h1 className="mb-2 text-center text-3xl font-semibold tracking-tight">Veelgestelde vragen</h1>
        <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-muted-foreground">
          Hier vindt u de antwoorden op veel voorkomende vragen. Staat uw vraag er niet tussen?<br />Gebruik dan het veld hieronder.
        </p>
        <Suspense fallback={<div>Loading…</div>}>
          <FaqClient context={params.context} />
        </Suspense>
      </main>
      
      {/* Footer - always at bottom */}
      <footer className="border-t border-gray-200 pt-8 pb-12">
        <div className="mx-auto w-full max-w-[620px] px-4 sm:px-0">
          <p className="text-center text-sm text-muted-foreground">
            © {currentYear} - Powered by{" "}
            <a 
              href="https://www.dennispetri.nl" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-black underline hover:no-underline"
            >
              FAQlue
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}