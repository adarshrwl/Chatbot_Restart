// src/pages/chat/ChatPage.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  ListGroup,
} from "react-bootstrap";
import "./ChatPage.css";

const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I'm here to help with any questions about our hospital. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoRead, setAutoRead] = useState(true); // Auto-read enabled by default
  const [lastUserQuery, setLastUserQuery] = useState(""); // To store the last query sent
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition on mount
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Browser does not support Speech Recognition API.");
    }
  }, []);

  // Start voice recognition
  const startVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  // Use text-to-speech to speak out the chatbot's reply if autoRead is enabled
  const speakText = (text) => {
    if (autoRead && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  // Toggle auto-read on or off
  const toggleAutoRead = () => {
    setAutoRead((prev) => !prev);
  };

  // Send the chat message to the backend; if a query is provided, use it instead of current input.
  const sendMessage = async (query) => {
    const userMessage = query || input;
    if (!userMessage.trim()) return;

    // Append user's message to conversation
    const newMessages = [...messages, { sender: "user", text: userMessage }];
    setMessages(newMessages);
    // Save the last query so we can resend it later
    setLastUserQuery(userMessage);
    // Clear input if not resending
    if (!query) setInput("");
    setLoading(true);

    try {
      const response = await axios.post(
        process.env.REACT_APP_CHAT_API_URL || "http://localhost:5000/api/chat",
        { message: userMessage },
        { headers: { "Content-Type": "application/json" } }
      );
      const botReply = response.data.reply;
      const updatedMessages = [
        ...newMessages,
        { sender: "bot", text: botReply },
      ];
      setMessages(updatedMessages);
      speakText(botReply);
    } catch (error) {
      console.error("Error sending message:", error);
      const updatedMessages = [
        ...newMessages,
        {
          sender: "bot",
          text: "Sorry, there was an error processing your query.",
        },
      ];
      setMessages(updatedMessages);
    }
    setLoading(false);
  };

  // Handle form submit for sending a new message
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  // Resend the last user query
  const handleResend = () => {
    if (lastUserQuery) {
      sendMessage(lastUserQuery);
    }
  };

  return (
    <Container fluid className="chat-page">
      <Row className="justify-content-center align-items-center h-100">
        <Col md={8} lg={6}>
          <Card className="chat-card shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Hospital Chatbot</span>
              <div>
                <Button
                  variant={autoRead ? "success" : "secondary"}
                  size="sm"
                  onClick={toggleAutoRead}
                >
                  {autoRead ? "Auto Read: ON" : "Auto Read: OFF"}
                </Button>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={handleResend}
                  disabled={!lastUserQuery || loading}
                  className="ml-2"
                >
                  Resend
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush" className="chat-messages">
                {messages.map((msg, index) => (
                  <ListGroup.Item
                    key={index}
                    className={
                      msg.sender === "bot" ? "bot-message" : "user-message"
                    }
                  >
                    <strong>{msg.sender === "bot" ? "Bot" : "You"}: </strong>
                    <span
                      dangerouslySetInnerHTML={{
                        __html: msg.text.replace(/\n/g, "<br/>"),
                      }}
                    ></span>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <Form onSubmit={handleSubmit} className="mt-3">
                <Form.Group controlId="chatInput">
                  <Form.Control
                    type="text"
                    placeholder="Type your message or click the mic to speak..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                  />
                </Form.Group>
                <div className="d-flex justify-content-between mt-2">
                  <Button
                    variant="secondary"
                    onClick={startVoiceInput}
                    disabled={loading}
                  >
                    🎤 Voice Input
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading || !input.trim()}
                  >
                    {loading ? "Sending..." : "Send"}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ChatPage;
