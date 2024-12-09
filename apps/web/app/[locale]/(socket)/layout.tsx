import SocketProvider from "@/contexts/SocketContext"

export type LocaleLayoutProps = Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>

export default async function SocketLayout(props: LocaleLayoutProps) {
  return <SocketProvider>{props.children}</SocketProvider>
}
