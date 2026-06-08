import { NextResponse } from "next/server";

export interface ApiMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: ApiMeta;
}

export function ok<T>(data: T, meta?: ApiMeta, status = 200): NextResponse {
  return NextResponse.json({ success: true, data, ...(meta && { meta }) }, { status });
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(error: string): NextResponse {
  return NextResponse.json({ success: false, error }, { status: 400 });
}

export function unauthorized(error = "Yetkisiz erişim."): NextResponse {
  return NextResponse.json({ success: false, error }, { status: 401 });
}

export function forbidden(error = "Bu işlem için yetkiniz yok."): NextResponse {
  return NextResponse.json({ success: false, error }, { status: 403 });
}

export function notFound(error = "Kayıt bulunamadı."): NextResponse {
  return NextResponse.json({ success: false, error }, { status: 404 });
}

export function conflict(error: string): NextResponse {
  return NextResponse.json({ success: false, error }, { status: 409 });
}

export function tooManyRequests(error: string, retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { success: false, error },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

export function serverError(error = "Sunucu hatası. Lütfen tekrar deneyin."): NextResponse {
  return NextResponse.json({ success: false, error }, { status: 500 });
}

export function validationError(errors: Record<string, string[]>): NextResponse {
  return NextResponse.json(
    { success: false, error: "Doğrulama hatası.", details: errors },
    { status: 422 }
  );
}

export function paginationMeta(
  total: number,
  page: number,
  limit: number
): ApiMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
