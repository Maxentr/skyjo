import { posthogServer } from "@/lib/posthog-server"
import InactivityCheck from "./InactivityCheck"
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

  const isInactivityCheckEnabled = await posthogServer.isFeatureEnabled(
    "inactivity-check",
    "web-server",
  )
  return (
    <>
      <Lobby gameCode={code} />
      {isInactivityCheckEnabled && <InactivityCheck />}
    </>
  )
}

export default LobbyServerPage
