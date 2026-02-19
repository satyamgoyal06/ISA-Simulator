import { TheoryContent } from "@/lib/types";

export const CN_THEORY: TheoryContent[] = [
    {
        topicSlug: "introduction",
        topicName: "Introduction",
        unit: 1,
        subject: "CN",
        summary: "Computer networks connect end systems via communication links and packet switches. The Internet uses a layered architecture (TCP/IP stack). Key concepts include packet switching vs. circuit switching, delay types, and layered protocols.",
        keyPoints: [
            "The Internet is a 'network of networks'.",
            "Packet switching shares resources on demand (statistical multiplexing).",
            "Four sources of delay: Processing, Queuing, Transmission, Propagation.",
            "Transmission delay = L/R; Propagation delay = d/s.",
            "Throughput is limited by the bottleneck link."
        ],
        commonMistakes: [
            "Confusing transmission delay (pushing bits) with propagation delay (travel time).",
            "Thinking queuing delay is constant (it varies with traffic).",
            "Confusing bandwidth (capacity) with throughput (actual rate)."
        ]
    },
    {
        topicSlug: "application-layer",
        topicName: "Application Layer",
        unit: 1,
        subject: "CN",
        summary: "The application layer enables network applications. It relies on transport services (TCP/UDP). Key protocols include HTTP (Web), SMTP (Email), and DNS (Domain Name System). Architectures are Client-Server or P2P.",
        keyPoints: [
            "Processes communicate via sockets.",
            "HTTP is stateless; cookies manage state.",
            "DNS translates hostnames to IP addresses (recursive vs. iterative queries).",
            "P2P architectures (BitTorrent) self-scale as users join."
        ],
        commonMistakes: [
            "confusing non-persistent HTTP (one object per connection) with persistent.",
            "Thinking DNS runs on TCP (it primarily uses UDP).",
            "Confusing 404 (Not Found) with 500 (Server Error)."
        ]
    },
    {
        topicSlug: "transport-layer",
        topicName: "Transport Layer",
        unit: 2,
        subject: "CN",
        summary: "Provides logical communication between processes. UDP is connectionless and unreliable. TCP is connection-oriented, providing reliability, flow control, and congestion control.",
        keyPoints: [
            "Multiplexing/Demultiplexing uses ports.",
            "Reliable Data Transfer (rdt) uses ACKs, timers, and sequence numbers.",
            "Go-Back-N (GBN) vs. Selective Repeat (SR) window protocols.",
            "TCP 3-way handshake: SYN, SYN-ACK, ACK.",
            "Flow control prevents receiver buffer overflow."
        ],
        commonMistakes: [
            "Thinking UDP guarantees order (it doesn't).",
            "Confusing Flow Control (receiver limit) with Congestion Control (network limit).",
            "Miscalculating sequence numbers (they count bytes, not packets)."
        ]
    }
];
