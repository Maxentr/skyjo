import Lobby from "./Lobby"

type LobbyLayoutParams = {
  code: string
  locale: string
}
type LobbyServerPageProps = {
  params: Promise<LobbyLayoutParams>
}

const LobbyServerPage = async (props: LobbyServerPageProps) => {
  const { code } = await props.params

  return <Lobby gameCode={code} />
}

export default LobbyServerPage
