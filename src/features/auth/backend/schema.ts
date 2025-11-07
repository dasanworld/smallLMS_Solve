import { z } from 'zod';

export const signupRequestSchema = z.object({
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요.' }),
  password: z.string().min(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' }),
  role: z.enum(['learner', 'instructor'], {
    errorMap: () => ({ message: '유효한 역할을 선택해주세요.' }),
  }),
  name: z.string().min(1, { message: '이름을 입력해주세요.' }),
  phone: z.string().min(1, { message: '휴대폰번호를 입력해주세요.' }),
  termsAgreed: z.boolean().refine((val) => val === true, {
    message: '약관에 동의해야 합니다.',
  }),
});

export type SignupRequest = z.infer<typeof signupRequestSchema>;

export const signupResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().nullable(),
  }),
  redirectTo: z.string(),
});

export type SignupResponse = z.infer<typeof signupResponseSchema>;