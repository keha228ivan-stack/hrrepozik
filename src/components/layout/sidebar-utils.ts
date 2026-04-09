export function isNavLinkActive(pathname: string, href: string) {
  const isLibraryLink = href === "/manager/courses";
  if (isLibraryLink) {
    return pathname.startsWith("/manager/courses");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
