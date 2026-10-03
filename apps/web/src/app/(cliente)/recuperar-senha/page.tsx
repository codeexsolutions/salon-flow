import { FormRecuperarSenha } from '@/components/auth/form-recuperar-senha';

export const metadata = { title: 'Recuperar senha' };

export default function RecuperarSenhaPage() {
  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-borda bg-superficie p-6 shadow-sm sm:p-10">
      <FormRecuperarSenha />
    </div>
  );
}
