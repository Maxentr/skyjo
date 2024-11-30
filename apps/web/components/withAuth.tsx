"use client"

import { useSocket } from "@/contexts/SocketContext"
import { useUser } from "@/contexts/UserContext"
import { useRouter } from "@/i18n/routing"
import { useParams } from "next/navigation"
import React, { ComponentType, useEffect, useState } from "react"

const withAuth = <P extends object>(
  WrappedComponent: ComponentType<P>,
): React.FC<P> =>
  function UpdatedComponent(props: P) {
    const { username, avatarIndex } = useUser()
    const { socket } = useSocket()
    const params = useParams()
    const router = useRouter()
    const [verified, setVerified] = useState(false)

    useEffect(() => {
      checkAuth()
    }, [router, avatarIndex, username, socket])

    const checkAuth = async () => {
      if (username && avatarIndex >= 0 && socket) setVerified(true)
      else if (params?.code) router.replace(`/?gameCode=${params?.code}`)
      else router.replace("/")
    }

    if (verified) {
      return <WrappedComponent {...props} />
    } else {
      return null
    }
  }

export default withAuth
