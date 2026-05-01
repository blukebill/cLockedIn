import { useEffect, useMemo, useRef, useState } from 'react'
import { getMessagesWebSocketUrl, messagesApi } from '../services/api'

function conversationTitle(conversation, currentUserId) {
  if (!conversation) return ''
  if (conversation.type === 'GROUP') return conversation.name || 'Group Chat'

  const other = conversation.participants?.find(participant => participant.id !== currentUserId)
  return other?.name || 'Direct Message'
}

function formatMessageTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function messageReadLabel(message, conversation, currentUserId) {
  if (!message || !conversation || message.senderId !== currentUserId) return ''

  const totalOtherParticipants = Number(
    message.totalOtherParticipants ?? Math.max((conversation.participants?.length || 1) - 1, 0),
  )
  if (totalOtherParticipants <= 0) return ''

  const readByOthersCount = Math.min(
    totalOtherParticipants,
    Math.max(Number(message.readByOthersCount || 0), 0),
  )

  if (conversation.type === 'GROUP') {
    return `${readByOthersCount} read`
  }

  return message.readByAll || readByOthersCount >= totalOtherParticipants ? 'Read' : 'Sent'
}

function MessagesPage({ role, user, onUnreadCountChange }) {
  const [contacts, setContacts] = useState([])
  const [conversations, setConversations] = useState([])
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [newDirectUserId, setNewDirectUserId] = useState('')
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupParticipantIds, setGroupParticipantIds] = useState([])
  const [addAllEmployees, setAddAllEmployees] = useState(false)
  const [error, setError] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [isLoading, setIsLoading] = useState(true)
  const socketRef = useRef(null)
  const selectedConversationIdRef = useRef(null)
  const userIdRef = useRef(user?.userId)
  const unreadCountCallbackRef = useRef(onUnreadCountChange)
  const messagesEndRef = useRef(null)

  const selectedConversation = useMemo(() => (
    conversations.find(conversation => conversation.id === selectedConversationId) || null
  ), [conversations, selectedConversationId])

  useEffect(() => {
    userIdRef.current = user?.userId
  }, [user?.userId])

  useEffect(() => {
    unreadCountCallbackRef.current = onUnreadCountChange
  }, [onUnreadCountChange])

  useEffect(() => {
    Promise.all([
      messagesApi.contacts(),
      messagesApi.conversations(),
    ])
      .then(([contactData, conversationData]) => {
        setContacts(Array.isArray(contactData) ? contactData : [])
        const nextConversations = Array.isArray(conversationData) ? conversationData : []
        setConversations(nextConversations)
        setSelectedConversationId(current => current || nextConversations[0]?.id || null)
      })
      .catch(err => setError(err.message || 'Unable to load messages.'))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedConversationId) {
      return
    }

    messagesApi.messages(selectedConversationId)
      .then(async data => {
        setMessages(Array.isArray(data) ? data : [])
        const updatedConversation = await messagesApi.markRead(selectedConversationId)
        setConversations(current => current.map(conversation => (
          conversation.id === updatedConversation.id ? updatedConversation : conversation
        )))
        const count = await messagesApi.unreadCount()
        onUnreadCountChange?.(Number(count) || 0)
      })
      .catch(err => setError(err.message || 'Unable to load conversation.'))
  }, [onUnreadCountChange, selectedConversationId])

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId
  }, [selectedConversationId])

  useEffect(() => {
    let active = true
    const socket = new WebSocket(getMessagesWebSocketUrl())
    socketRef.current = socket

    socket.onopen = () => {
      if (!active || socketRef.current !== socket) return
      setConnectionStatus('connected')
      setError(current => current === 'Message connection failed.' ? '' : current)
    }

    socket.onmessage = (event) => {
      if (!active || socketRef.current !== socket) return
      const payload = JSON.parse(event.data)
      if (payload.type === 'ERROR') {
        setError(payload.error || 'Message failed.')
        return
      }
      if (payload.type === 'READ_RECEIPT' && payload.readReceipt) {
        const receipt = payload.readReceipt
        if (
          receipt.readerId !== userIdRef.current &&
          receipt.conversationId === selectedConversationIdRef.current
        ) {
          messagesApi.messages(receipt.conversationId)
            .then(data => setMessages(Array.isArray(data) ? data : []))
            .catch(() => {})
        }
        return
      }
      if (payload.type !== 'MESSAGE' || !payload.message) return

      const nextMessage = payload.message
      setConversations(current => current.map(conversation => (
        conversation.id === nextMessage.conversationId
          ? { ...conversation, lastMessage: nextMessage, updatedAt: nextMessage.createdAt }
          : conversation
      )))
      setMessages(current => {
        if (nextMessage.conversationId !== selectedConversationIdRef.current) return current
        if (current.some(message => message.id === nextMessage.id)) return current
        return [...current, nextMessage]
      })

      if (nextMessage.conversationId === selectedConversationIdRef.current) {
        messagesApi.markRead(nextMessage.conversationId)
          .then(updatedConversation => {
            setConversations(current => current.map(conversation => (
              conversation.id === updatedConversation.id ? updatedConversation : conversation
            )))
            return messagesApi.unreadCount()
          })
          .then(count => unreadCountCallbackRef.current?.(Number(count) || 0))
          .catch(() => {})
      } else if (nextMessage.senderId !== userIdRef.current) {
        setConversations(current => current.map(conversation => (
          conversation.id === nextMessage.conversationId
            ? { ...conversation, unreadCount: (conversation.unreadCount || 0) + 1 }
            : conversation
        )))
        unreadCountCallbackRef.current?.(current => Number(current || 0) + 1)
      }
    }

    socket.onerror = () => {
      if (!active || socketRef.current !== socket) return
      setConnectionStatus('failed')
    }

    socket.onclose = () => {
      if (!active || socketRef.current !== socket) return
      setConnectionStatus('closed')
    }

    return () => {
      active = false
      socket.close()
      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const refreshConversations = async (selectedId = selectedConversationId) => {
    const data = await messagesApi.conversations()
    const nextConversations = Array.isArray(data) ? data : []
    setConversations(nextConversations)
    setSelectedConversationId(selectedId || nextConversations[0]?.id || null)
    const count = await messagesApi.unreadCount()
    onUnreadCountChange?.(Number(count) || 0)
  }

  const createDirectConversation = async (event) => {
    event.preventDefault()
    if (!newDirectUserId) return

    setError('')
    try {
      const conversation = await messagesApi.createConversation({
        participantIds: [Number(newDirectUserId)],
        group: false,
      })
      setNewDirectUserId('')
      await refreshConversations(conversation.id)
    } catch (err) {
      setError(err.message || 'Unable to create direct message.')
    }
  }

  const createGroupConversation = async (event) => {
    event.preventDefault()
    setError('')

    try {
      const conversation = await messagesApi.createConversation({
        name: groupName,
        participantIds: groupParticipantIds.map(Number),
        addAllEmployees,
        group: true,
      })
      setGroupName('')
      setGroupParticipantIds([])
      setAddAllEmployees(false)
      setShowGroupForm(false)
      await refreshConversations(conversation.id)
    } catch (err) {
      setError(err.message || 'Unable to create group chat.')
    }
  }

  const sendMessage = async (event) => {
    event.preventDefault()
    const content = draft.trim()
    if (!selectedConversationId || !content) return

    setDraft('')
    setError('')

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        conversationId: selectedConversationId,
        content,
      }))
      return
    }

    try {
      await messagesApi.sendMessage(selectedConversationId, content)
    } catch (err) {
      setError(err.message || 'Unable to send message.')
      setDraft(content)
    }
  }

  const toggleGroupParticipant = (userId) => {
    setGroupParticipantIds(current => (
      current.includes(userId)
        ? current.filter(id => id !== userId)
        : [...current, userId]
    ))
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-7rem)] grid grid-cols-1 lg:grid-cols-[20rem_1fr] gap-6">
      <aside className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Messages</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Restaurant conversations</p>
        </div>

        {error && (
          <p className="px-4 py-3 text-sm text-red-600 dark:text-red-400 border-b border-red-100 dark:border-red-900/30">
            {error}
          </p>
        )}

        {connectionStatus === 'failed' && (
          <p className="px-4 py-2 text-xs text-yellow-700 dark:text-yellow-300 border-b border-yellow-100 dark:border-yellow-900/30">
            Live messaging is disconnected. Messages will send with refresh fallback.
          </p>
        )}

        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          <form onSubmit={createDirectConversation} className="flex gap-2">
            <select
              value={newDirectUserId}
              onChange={event => setNewDirectUserId(event.target.value)}
              className="min-w-0 flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">New direct message</option>
              {contacts.map(contact => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
            </select>
            <button
              type="submit"
              disabled={!newDirectUserId}
              className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold"
            >
              Start
            </button>
          </form>

          {role === 'manager' && (
            <button
              type="button"
              onClick={() => setShowGroupForm(current => !current)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {showGroupForm ? 'Close Group Form' : 'Create Group Chat'}
            </button>
          )}
        </div>

        {showGroupForm && role === 'manager' && (
          <form onSubmit={createGroupConversation} className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
            <input
              value={groupName}
              onChange={event => setGroupName(event.target.value)}
              placeholder="Group name"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                checked={addAllEmployees}
                onChange={event => setAddAllEmployees(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              Add all employees
            </label>
            {!addAllEmployees && (
              <div className="max-h-36 overflow-y-auto space-y-2">
                {contacts.map(contact => (
                  <label key={contact.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={groupParticipantIds.includes(contact.id)}
                      onChange={() => toggleGroupParticipant(contact.id)}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    {contact.name}
                  </label>
                ))}
              </div>
            )}
            <button
              type="submit"
              disabled={!addAllEmployees && groupParticipantIds.length === 0}
              className="w-full px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold"
            >
              Create Group
            </button>
          </form>
        )}

        <div className="flex-1 overflow-y-auto">
          {isLoading && <p className="p-4 text-sm text-gray-500 dark:text-gray-400">Loading conversations...</p>}
          {!isLoading && conversations.length === 0 && (
            <p className="p-4 text-sm text-gray-500 dark:text-gray-400">No conversations yet.</p>
          )}
          {conversations.map(conversation => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => setSelectedConversationId(conversation.id)}
              className={`w-full px-4 py-3 text-left border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedConversationId === conversation.id ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {conversationTitle(conversation, user?.userId)}
                </p>
                <div className="flex items-center gap-2">
                  {conversation.unreadCount > 0 && (
                    <span className="min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] leading-5 text-center font-semibold">
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </span>
                  )}
                  <span className="text-[10px] uppercase text-gray-400 dark:text-gray-500">{conversation.type}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                {conversation.lastMessage?.content || `${conversation.participants?.length || 0} participants`}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden flex flex-col min-h-0">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {conversationTitle(selectedConversation, user?.userId)}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedConversation.participants?.map(participant => participant.name).join(', ')}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(message => {
                const mine = message.senderId === user?.userId
                const readLabel = messageReadLabel(message, selectedConversation, user?.userId)
                return (
                  <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-xl px-3 py-2 ${mine ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>
                      {!mine && <p className="text-xs font-semibold opacity-80 mb-1">{message.senderName}</p>}
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      <div className={`flex items-center justify-end gap-2 text-[11px] mt-1 ${mine ? 'text-green-100' : 'text-gray-400 dark:text-gray-500'}`}>
                        <span>{formatMessageTime(message.createdAt)}</span>
                        {readLabel && <span>{readLabel}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <input
                value={draft}
                onChange={event => setDraft(event.target.value)}
                placeholder="Type a message"
                className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            Select or create a conversation.
          </div>
        )}
      </section>
    </div>
  )
}

export default MessagesPage
