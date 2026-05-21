export default async (request, context) => {
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();

  if (host === 'abawi.sn' || host === 'www.abawi.sn') {
    url.hostname = 'abawi.app';
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
};
