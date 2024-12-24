"use client"

import { AutoCompleteChoice, Autocomplete } from "@/components/ui/autocomplete"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useChat } from "@/contexts/ChatContext"
import { useSkyjo } from "@/contexts/SkyjoContext"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { SendIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const chatFormSchema = z.object({
  message: z.string().max(200),
})

type ChatFormProps = {
  chatOpen: boolean
}

const ChatForm = ({ chatOpen }: ChatFormProps) => {
  const { toast } = useToast()
  const { player, opponents } = useSkyjo()
  const {
    sendMessage,
    clearUnreadMessages,
    mutePlayer,
    unmutePlayer,
    addSystemMessage,
    wizzPlayer,
  } = useChat()
  const t = useTranslations("components.ChatForm")
  const form = useForm<z.infer<typeof chatFormSchema>>({
    resolver: zodResolver(chatFormSchema),
    defaultValues: {
      message: "",
    },
  })

  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteOptions, setAutocompleteOptions] = useState<
    Array<AutoCompleteChoice>
  >([])
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0)
  const [tabIndex, setTabIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)

  const commands: AutoCompleteChoice[] = [
    { name: "/mute [username]", value: "/mute", description: "Mute a player" },
    {
      name: "/unmute [username]",
      value: "/unmute",
      description: "Unmute a player",
    },
    {
      name: "/wizz [username]",
      value: "/wizz",
      description:
        "Shake the screen and play a sound to get a player's attention",
    },
  ]

  useEffect(() => {
    if (chatOpen) setTimeout(() => setTabIndex(0), 300)
    else setTabIndex(-1)
  }, [chatOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    form.setValue("message", value)

    if (value.startsWith("/")) {
      const [command, ...args] = value.split(" ")
      if (command === "/mute" || command === "/unmute") {
        handleNameTagSuggestion(args.join(" "), false)
      } else if (command === "/wizz") {
        handleNameTagSuggestion(args.join(" "), false)
      } else {
        handleCommandSuggestion(command)
      }
    } else if (value.includes("@")) {
      const lastWord = value.split(" ").pop() ?? ""
      if (lastWord.startsWith("@")) {
        handleNameTagSuggestion(lastWord)
      } else {
        setShowAutocomplete(false)
      }
    } else {
      setShowAutocomplete(false)
    }
  }

  const handleNameTagSuggestion = (lastWord: string, addAtSymbol = true) => {
    const searchTerm = addAtSymbol
      ? lastWord.slice(1).toLowerCase()
      : lastWord.toLowerCase()
    const matchingPlayers = opponents
      .flat()
      .map((p) => ({
        name: p.name,
        value: `@${p.name}`,
      }))
      .filter((p) => p.value.toLowerCase().includes(searchTerm))

    setAutocompleteOptions(matchingPlayers)
    setShowAutocomplete(matchingPlayers.length > 0)
    setSelectedOptionIndex(0)
  }

  const handleCommandSuggestion = (lastWord: string) => {
    const matchingCommands = commands.filter((cmd) =>
      cmd.value.startsWith(lastWord),
    )
    setAutocompleteOptions(matchingCommands)
    setShowAutocomplete(matchingCommands.length > 0)
    setSelectedOptionIndex(0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showAutocomplete) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        const newIndex =
          e.key === "ArrowDown"
            ? (selectedOptionIndex + 1) % autocompleteOptions.length
            : (selectedOptionIndex - 1 + autocompleteOptions.length) %
              autocompleteOptions.length
        setSelectedOptionIndex(newIndex)
        scrollToOption(newIndex)
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        insertPlayerTag(autocompleteOptions[selectedOptionIndex].value)
      }
    } else if (e.key === "Tab") {
      e.preventDefault()
      const currentValue = form.getValues("message")
      const words = currentValue.split(" ")
      const lastWord = words[words.length - 1]

      if (lastWord.startsWith("/")) {
        const matchingCommands = commands.filter((cmd) =>
          cmd.value.startsWith(lastWord),
        )

        if (matchingCommands.length === 1) {
          words[words.length - 1] = matchingCommands[0].value
          form.setValue("message", words.join(" ") + " ")
        } else if (matchingCommands.length > 1) {
          setAutocompleteOptions(matchingCommands)
          setShowAutocomplete(true)
          setSelectedOptionIndex(0)
        }
      }
    }
  }

  const scrollToOption = (index: number) => {
    const optionElement = document.getElementById(
      `autocomplete-option-${index}`,
    )
    optionElement?.scrollIntoView({ block: "nearest" })
  }

  const insertPlayerTag = (option: string) => {
    const currentValue = form.getValues("message")
    const words = currentValue.split(" ")

    words[words.length - 1] = option

    setShowAutocomplete(false)
    const newValue = words.join(" ") + " "
    form.setValue("message", newValue)
    inputRef.current?.focus()
  }

  const onSubmit = (values: z.infer<typeof chatFormSchema>) => {
    if (!values.message) return

    if (values.message.length > 200) {
      toast({
        description: t("message-too-long.description"),
        variant: "destructive",
        duration: 3000,
      })
    } else {
      const [command, ...args] = values.message.split(" ")
      if (command.startsWith("/")) {
        handleCommand(command, args.join(" "))
      } else {
        sendMessage(player.name, values.message)
        clearUnreadMessages()
      }
    }

    form.reset()
  }

  const handleCommand = (command: string, args: string) => {
    switch (command) {
      case "/mute":
        mutePlayer(args.slice(1).trim() ?? "")
        break
      case "/unmute":
        unmutePlayer(args.slice(1).trim() ?? "")
        break
      case "/wizz":
        wizzPlayer(args.slice(1).trim() ?? "")
        break
      default:
        addSystemMessage(t("unknown-command", { command }))
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-row items-end w-full gap-2 relative"
      >
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem className="flex flex-1">
              <FormControl>
                <Input
                  placeholder={t("message-input-placeholder")}
                  className={cn(
                    "flex flex-1",
                    form.formState.errors.message &&
                      "focus-visible:ring-red-500",
                  )}
                  tabIndex={tabIndex}
                  autoComplete="off"
                  {...field}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  ref={inputRef}
                />
              </FormControl>
            </FormItem>
          )}
        />
        {showAutocomplete && (
          <Autocomplete
            choices={autocompleteOptions}
            onSelect={insertPlayerTag}
            selectedIndex={selectedOptionIndex}
          />
        )}
        <Button
          variant="icon"
          type="submit"
          title={t("button-title")}
          tabIndex={tabIndex}
        >
          <SendIcon width={16} height={16} />
        </Button>
      </form>
    </Form>
  )
}

export default ChatForm
