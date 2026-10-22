export default defineNuxtRouteMiddleware((to) => {
  const tokenCookie = useCookie<string | null>('susi_token');
  const hasToken = !!tokenCookie.value;

  if (!hasToken && to.path !== '/login') {
    return navigateTo('/login');
  }

  if (hasToken && to.path === '/login') {
    return navigateTo('/');
  }
});
