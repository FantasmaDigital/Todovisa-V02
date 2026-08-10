import SignUpForm from "@/app/components/signup/Form";
import { Suspense } from "react";

const SignInPage = () => {
  return (
    <div className="flex w-full min-h-screen bg-white">
      <div className="hidden md:flex flex-col justify-center items-center w-[60%] p-12 text-white" style={{backgroundImage: 'url("/images/backgrounds/canada.webp")' , backgroundSize: 'cover', backgroundPosition: 'center'}}>
        <div className="max-w-md flex flex-col gap-10 text-center">
          <h2 className="text-5xl font-bold">Empieza tu aventura hoy</h2>
          <p className="text-lg text-brand-primary-light/90">
            Regístrate y descubre cómo podemos ayudarte a gestionar tus trámites de forma rápida y segura.
          </p>
        </div>
      </div>
      <Suspense fallback={
        <div className="w-full md:w-1/2 flex items-center justify-center p-4">
          <span className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></span>
        </div>
      }>
        <SignUpForm />
      </Suspense>
    </div>
  );
};

export default SignInPage;