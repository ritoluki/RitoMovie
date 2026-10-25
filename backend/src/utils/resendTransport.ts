import ApiError from './ApiError';

interface Message {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendWithResend(message: Message): Promise<string> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM?.trim();
  if (!key || !from || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(from)) {
    throw new ApiError(
      400,
      'Set RESEND_API_KEY and a valid EMAIL_FROM in the backend environment.'
    );
  }
  const name = (process.env.EMAIL_FROM_NAME || 'RitoMovie').replace(
    /[<>"\r\n]/g,
    ''
  );
  let response: Response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...message,
        from: `${name} <${from}>`,
        to: [message.to],
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError(
      502,
      'Cannot connect to Resend. Check the network and try again.'
    );
  }
  // Never expose a provider response which might contain credentials or message content.
  if (!response.ok) {
    await response.body?.cancel();
    if (response.status === 429)
      throw new ApiError(429, 'Resend sending limit reached. Try again later.');
    throw new ApiError(
      502,
      'Resend rejected the email. Check the API key, sending permissions and verified sender domain.'
    );
  }
  const result = (await response.json().catch(() => null)) as {
    id?: string;
  } | null;
  if (!result?.id)
    throw new ApiError(502, 'Resend did not confirm acceptance of the email.');
  return result.id;
}
