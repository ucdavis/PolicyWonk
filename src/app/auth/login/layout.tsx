export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='card'>
      <div className='card-body text-center'>{children}</div>
    </div>
  );
}
