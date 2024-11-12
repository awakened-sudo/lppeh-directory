import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import OpenAI from 'openai';
import React from 'react';

// Assign your API key
const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, // Ensure this is set securely on the server side
    dangerouslyAllowBrowser: true
});

export function Chatbot() {
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: "system" | "user" | "assistant"; content: string; }[]>([
    {
      role: "system",
      content: "You are a helpful assistant.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!userInput.trim()) return;

    setIsLoading(true);
    setHasError(null);

    const userMessage = {
      role: "user" as const,
      content: userInput,
    };

    const updatedChatHistory = [...chatHistory, userMessage];

    try {
      // Create a chat completion request
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: updatedChatHistory,
      });

      // Extract the assistant's response
      const botResponse = completion.choices[0].message?.content?.trim() || "Sorry, I couldn't understand that.";

      const assistantMessage = {
        role: "assistant" as const,
        content: botResponse,
      };

      // Update chat history with the assistant's response
      setChatHistory([...updatedChatHistory, assistantMessage]);
      setUserInput('');
    } catch (error) {
      console.error("Error fetching chat completion:", error);
      setHasError("Failed to fetch response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container p-4 border rounded-lg space-y-4">
      <div className="chat-history space-y-2">
        {chatHistory.map((entry, index) => (
          <p key={index} className="text-sm">
            {entry.role === "user" ? `You: ${entry.content}` : `Bot: ${entry.content}`}
          </p>
        ))}
      </div>
      {hasError && <p className="text-red-500 text-sm">{hasError}</p>}
      <div className="flex items-center space-x-2">
        <Input
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask something..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button onClick={handleSend} disabled={isLoading}>
          {isLoading ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
} 