'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  MessageSquare,
  Sparkles,
  Clock,
  BarChart3,
  Table,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  History,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { EXAMPLE_QUERIES } from '@/schemas/ai-query';
import type {
  NLQueryResponse,
  Conversation,
  QueryHistoryItem
} from '@/schemas/ai-query';

interface QueryMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  queryResult?: NLQueryResponse['data'];
  loading?: boolean;
  error?: string;
}

interface NaturalLanguageChatProps {
  className?: string;
}

export function NaturalLanguageChat({
  className = ''
}: NaturalLanguageChatProps) {
  const [messages, setMessages] = useState<QueryMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load conversation history
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/ai/conversations');
      if (!response.ok) throw new Error('Failed to load conversations');

      const result = await response.json();
      if (result.ok) {
        setConversations(result.data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const handleSendQuery = async (query?: string) => {
    const queryText = query || inputValue.trim();
    if (!queryText || loading) return;

    // Add user message
    const userMessage: QueryMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: queryText,
      timestamp: new Date()
    };

    // Add loading assistant message
    const assistantMessage: QueryMessage = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content: 'Analyzing your query...',
      timestamp: new Date(),
      loading: true
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: queryText,
          conversation_id: currentConversationId,
          language: 'de'
        })
      });

      const result: NLQueryResponse = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Query failed');
      }

      // Update conversation ID
      if (result.data?.conversation_id) {
        setCurrentConversationId(result.data.conversation_id);
      }

      // Update assistant message with results
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content: generateResponseContent(result.data!),
                queryResult: result.data,
                loading: false
              }
            : msg
        )
      );

      // Refresh conversations list
      await loadConversations();
    } catch (error) {
      // Update assistant message with error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? {
                ...msg,
                content:
                  'Entschuldigung, es gab einen Fehler beim Verarbeiten Ihrer Anfrage.',
                error: error instanceof Error ? error.message : 'Unknown error',
                loading: false
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const generateResponseContent = (
    data: NonNullable<NLQueryResponse['data']>
  ): string => {
    const { interpreted_query, total_results, execution_summary } = data;

    let content = `Ich habe Ihre Anfrage als "${interpreted_query}" interpretiert.\n\n`;

    if (total_results === 0) {
      content +=
        '🔍 Keine Ergebnisse gefunden. Versuchen Sie eine andere Formulierung.';
    } else if (total_results === 1) {
      content += `✅ 1 Ergebnis gefunden in ${execution_summary.processing_time_ms}ms.`;
    } else {
      content += `✅ ${total_results} Ergebnisse gefunden in ${execution_summary.processing_time_ms}ms.`;
    }

    if (execution_summary.confidence < 0.7) {
      content +=
        '\n\n⚠️ Niedrige Konfidenz - möglicherweise nicht die gewünschten Ergebnisse.';
    }

    return content;
  };

  const handleExampleClick = (example: string) => {
    setInputValue(example);
    inputRef.current?.focus();
  };

  const startNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
  };

  const loadConversation = async (conversationId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/ai/conversations/${conversationId}/queries`
      );
      if (!response.ok) throw new Error('Failed to load conversation');

      const result = await response.json();
      if (result.ok) {
        // Convert queries to messages format
        const conversationMessages: QueryMessage[] = [];

        result.data.queries.forEach((query: QueryHistoryItem) => {
          conversationMessages.push({
            id: `user-${query.id}`,
            type: 'user',
            content: query.original_query,
            timestamp: new Date(query.created_at)
          });

          conversationMessages.push({
            id: `assistant-${query.id}`,
            type: 'assistant',
            content:
              query.status === 'completed'
                ? `✅ ${query.result_count} Ergebnisse gefunden`
                : `❌ Fehler: ${query.error_message}`,
            timestamp: new Date(query.created_at)
          });
        });

        setMessages(conversationMessages.reverse());
        setCurrentConversationId(conversationId);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(
        `/api/ai/conversations?id=${conversationId}`,
        {
          method: 'DELETE'
        }
      );

      if (response.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));

        // If current conversation was deleted, start new one
        if (currentConversationId === conversationId) {
          startNewConversation();
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const renderQueryResults = (
    queryResult: NonNullable<NLQueryResponse['data']>
  ) => {
    if (!queryResult.results || queryResult.results.length === 0) {
      return null;
    }

    const { visualization_type, results } = queryResult;

    switch (visualization_type) {
      case 'metrics':
        return (
          <div className='mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {results.map((result, index) => (
              <Card key={index} className='border-l-4 border-l-blue-500'>
                <CardContent className='p-4'>
                  {Object.entries(result.data).map(([key, value]) => (
                    <div key={key} className='text-center'>
                      <div className='text-2xl font-bold text-blue-600'>
                        {typeof value === 'number'
                          ? value.toLocaleString()
                          : value}
                      </div>
                      <div className='text-muted-foreground text-xs capitalize'>
                        {key.replace(/_/g, ' ')}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'table':
        const firstResult = results[0];
        if (!firstResult.metadata?.columns) return null;

        return (
          <div className='mt-4 rounded-lg border'>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead className='bg-muted/50'>
                  <tr>
                    {firstResult.metadata.columns.map((col) => (
                      <th key={col} className='px-3 py-2 text-left font-medium'>
                        {col
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 10).map((result, index) => (
                    <tr key={index} className='border-t'>
                      {firstResult.metadata!.columns.map((col) => (
                        <td key={col} className='px-3 py-2'>
                          {result.data[col] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {results.length > 10 && (
              <div className='text-muted-foreground bg-muted/30 px-3 py-2 text-xs'>
                Showing 10 of {results.length} results
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getVisualizationIcon = (type: string) => {
    switch (type) {
      case 'metrics':
        return <BarChart3 className='h-4 w-4' />;
      case 'table':
        return <Table className='h-4 w-4' />;
      case 'chart':
        return <TrendingUp className='h-4 w-4' />;
      default:
        return <MessageSquare className='h-4 w-4' />;
    }
  };

  return (
    <div
      className={`bg-background flex h-[600px] rounded-lg border ${className}`}
    >
      {/* Sidebar */}
      <div
        className={`bg-muted/30 flex w-80 flex-col border-r transition-all duration-300 ${
          showHistory
            ? 'translate-x-0'
            : 'absolute inset-y-0 left-0 z-10 -translate-x-full lg:relative lg:translate-x-0'
        }`}
      >
        <div className='border-b p-4'>
          <div className='mb-4 flex items-center justify-between'>
            <h3 className='flex items-center gap-2 font-semibold'>
              <History className='h-4 w-4' />
              Conversation History
            </h3>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowHistory(false)}
              className='lg:hidden'
            >
              ×
            </Button>
          </div>
          <Button
            variant='outline'
            className='w-full'
            onClick={startNewConversation}
          >
            <MessageSquare className='mr-2 h-4 w-4' />
            New Chat
          </Button>
        </div>

        <ScrollArea className='flex-1'>
          <div className='p-2'>
            {conversations.length === 0 ? (
              <div className='text-muted-foreground py-8 text-center text-sm'>
                No conversations yet
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`hover:bg-muted mb-2 flex cursor-pointer items-center gap-2 rounded-lg p-3 transition-colors ${
                    currentConversationId === conversation.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => loadConversation(conversation.id)}
                >
                  <div className='min-w-0 flex-1'>
                    <div className='truncate text-sm font-medium'>
                      {conversation.title || 'Untitled'}
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      {conversation.query_count} queries
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conversation.id);
                    }}
                  >
                    <Trash2 className='h-3 w-3' />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className='flex flex-1 flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between border-b p-4'>
          <div className='flex items-center gap-3'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowHistory(!showHistory)}
              className='lg:hidden'
            >
              <History className='h-4 w-4' />
            </Button>
            <div>
              <h2 className='flex items-center gap-2 font-semibold'>
                <Sparkles className='h-5 w-5 text-purple-500' />
                Natural Language Query
              </h2>
              <p className='text-muted-foreground text-sm'>
                Ask questions about your CRM data in natural language
              </p>
            </div>
          </div>
          <Button variant='outline' size='sm' onClick={loadConversations}>
            <RefreshCw className='h-4 w-4' />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className='flex-1 p-4'>
          {messages.length === 0 ? (
            <div className='space-y-6'>
              {/* Welcome Message */}
              <Card>
                <CardContent className='p-6'>
                  <div className='space-y-4 text-center'>
                    <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100'>
                      <MessageSquare className='h-6 w-6 text-purple-600' />
                    </div>
                    <div>
                      <h3 className='text-lg font-semibold'>
                        Willkommen zum AI Query Interface
                      </h3>
                      <p className='text-muted-foreground'>
                        Stellen Sie Fragen zu Ihren CRM-Daten in natürlicher
                        Sprache
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Examples */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <Lightbulb className='h-4 w-4 text-yellow-500' />
                    Beispiele zum Ausprobieren
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid gap-2'>
                    {EXAMPLE_QUERIES.de.slice(0, 6).map((example, index) => (
                      <Button
                        key={index}
                        variant='outline'
                        className='h-auto justify-start p-3 text-left'
                        onClick={() => handleExampleClick(example)}
                      >
                        <div className='truncate'>{example}</div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className='space-y-4'>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : ''}`}
                >
                  {message.type === 'assistant' && (
                    <div className='mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100'>
                      <Sparkles className='h-4 w-4 text-purple-600' />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}
                  >
                    <div
                      className={`rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      }`}
                    >
                      {message.loading ? (
                        <div className='flex items-center gap-2'>
                          <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <div className='text-sm whitespace-pre-wrap'>
                          {message.content}
                        </div>
                      )}

                      {message.error && (
                        <Alert className='mt-2'>
                          <AlertCircle className='h-4 w-4' />
                          <AlertDescription>{message.error}</AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {message.queryResult &&
                      renderQueryResults(message.queryResult)}

                    <div className='text-muted-foreground mt-1 px-3 text-xs'>
                      <div className='flex items-center gap-2'>
                        <Clock className='h-3 w-3' />
                        {message.timestamp.toLocaleTimeString()}
                        {message.queryResult && (
                          <>
                            {getVisualizationIcon(
                              message.queryResult.visualization_type
                            )}
                            <Badge variant='secondary' className='text-xs'>
                              {Math.round(
                                message.queryResult.execution_summary
                                  .confidence * 100
                              )}
                              % confidence
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>

                    {message.queryResult?.suggestions && (
                      <div className='mt-3 space-y-1'>
                        <div className='text-muted-foreground px-3 text-xs'>
                          Follow-up suggestions:
                        </div>
                        {message.queryResult.suggestions.map(
                          (suggestion, index) => (
                            <Button
                              key={index}
                              variant='ghost'
                              size='sm'
                              className='h-auto p-2 text-xs'
                              onClick={() => handleExampleClick(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className='border-t p-4'>
          <div className='flex gap-2'>
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder='Fragen Sie etwas über Ihre CRM-Daten...'
              onKeyPress={(e) => e.key === 'Enter' && handleSendQuery()}
              disabled={loading}
              className='flex-1'
            />
            <Button
              onClick={() => handleSendQuery()}
              disabled={!inputValue.trim() || loading}
              size='icon'
            >
              <Send className='h-4 w-4' />
            </Button>
          </div>

          <div className='text-muted-foreground mt-2 flex items-center justify-between text-xs'>
            <span>Press Enter to send</span>
            <span>Powered by AI Query Intelligence</span>
          </div>
        </div>
      </div>
    </div>
  );
}
