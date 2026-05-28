import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormErrors } from "@/components/shared/FormErrors";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { mapApiErrors } from "@/features/auth/lib/map-api-errors";
import {
  useVerifyEmail,
  useResendVerificationOtp,
} from "@/api/hooks/use-auth";

const verifySchema = z.object({
  otp: z.string().regex(/^\d{4,8}$/, "Código inválido"),
});

type VerifyFormValues = z.infer<typeof verifySchema>;

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const verify = useVerifyEmail();
  const resend = useResendVerificationOtp();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { otp: "" },
  });

  if (!email) {
    return <Navigate to="/register" replace />;
  }

  async function onSubmit(data: VerifyFormValues) {
    try {
      await verify.mutateAsync({ email, otp_code: data.otp });
      toast.success("Tu email fue verificado. Ya puedes iniciar sesión.");
      navigate("/login", { replace: true });
    } catch (err) {
      mapApiErrors(err, setError, "No pudimos verificar el código.", {
        fieldMap: { otp_code: "otp" },
        formFields: ["otp"],
      });
    }
  }

  async function handleResend() {
    try {
      await resend.mutateAsync(email);
      toast.success("Te enviamos un nuevo código.");
    } catch {
      toast.error("No pudimos reenviar el código. Intenta de nuevo.");
    }
  }

  return (
    <AuthLayout
      title="Verifica tu email"
      description={`Enviamos un código a ${email}`}
      footer={
        <button
          type="button"
          onClick={handleResend}
          disabled={resend.isPending}
          className="font-medium text-primary hover:underline disabled:opacity-60"
        >
          {resend.isPending ? "Reenviando…" : "Reenviar código"}
        </button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormErrors message={errors.root?.message} />

        <div className="space-y-1.5">
          <Label htmlFor="otp">Código</Label>
          <Input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            placeholder="123456"
            aria-invalid={Boolean(errors.otp)}
            {...register("otp")}
          />
          {errors.otp && (
            <p className="text-sm text-destructive">{errors.otp.message}</p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Verificando…" : "Verificar"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          ¿Email incorrecto?{" "}
          <Link to="/register" className="underline hover:text-foreground">
            Regístrate de nuevo
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
