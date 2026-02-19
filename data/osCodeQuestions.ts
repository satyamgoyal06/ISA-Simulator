import type { MCQQuestion } from "@/lib/types";

/**
 * Code-based MCQs for OS — students must read and reason about code snippets.
 * Covers: fork(), pipes, semaphores, Peterson's solution, bounded buffer, pthreads.
 */
export const OS_CODE_QUESTIONS: MCQQuestion[] = [
    /* ── fork() output prediction ─────────────────────────── */
    {
        kind: "mcq",
        id: "OS-CODE-1",
        subject: "OS",
        unit: 2,
        topicSlug: "processes",
        topic: "processes",
        prompt: "What is the total number of processes created (including the original) by the following code?\n\n```c\nint main() {\n  fork();\n  fork();\n  fork();\n  return 0;\n}\n```",
        options: ["4", "8", "6", "3"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "Each fork() doubles the number of processes. Starting with 1: after first fork → 2, after second → 4, after third → 8."
    },
    {
        kind: "mcq",
        id: "OS-CODE-2",
        subject: "OS",
        unit: 2,
        topicSlug: "processes",
        topic: "processes",
        prompt: "What will the following code print in the child process?\n\n```c\nint main() {\n  int x = 10;\n  pid_t pid = fork();\n  if (pid == 0) {\n    x = x + 5;\n    printf(\"%d\", x);\n  } else {\n    x = x - 5;\n    printf(\"%d\", x);\n  }\n  return 0;\n}\n```",
        options: ["5", "15", "10", "Undefined"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "In the child process pid == 0, so x = 10 + 5 = 15. The parent prints 5. fork() creates separate address spaces."
    },
    {
        kind: "mcq",
        id: "OS-CODE-3",
        subject: "OS",
        unit: 2,
        topicSlug: "processes",
        topic: "processes",
        prompt: "How many times will 'Hello' be printed?\n\n```c\nint main() {\n  fork();\n  printf(\"Hello\\n\");\n  fork();\n  printf(\"Hello\\n\");\n  return 0;\n}\n```",
        options: ["4", "6", "3", "2"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "After first fork: 2 processes each print Hello (2 prints). Then each forks again: 4 processes each print Hello (4 prints). Total = 6."
    },
    {
        kind: "mcq",
        id: "OS-CODE-4",
        subject: "OS",
        unit: 2,
        topicSlug: "processes",
        topic: "processes",
        prompt: "What value does fork() return to the parent process?\n\n```c\npid_t pid = fork();\nif (pid > 0) {\n  printf(\"Parent: pid=%d\\n\", pid);\n} else if (pid == 0) {\n  printf(\"Child\\n\");\n}\n```",
        options: ["0", "The PID of the child process", "-1", "The PID of the parent process"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "fork() returns the child's PID to the parent, 0 to the child, and -1 on error."
    },
    {
        kind: "mcq",
        id: "OS-CODE-5",
        subject: "OS",
        unit: 2,
        topicSlug: "processes",
        topic: "processes",
        prompt: "What happens if wait(NULL) is not called by the parent?\n\n```c\nint main() {\n  pid_t pid = fork();\n  if (pid == 0) {\n    printf(\"Child done\\n\");\n    exit(0);\n  }\n  // Parent continues without wait()\n  sleep(60);\n  return 0;\n}\n```",
        options: ["The child is terminated immediately", "The child becomes a zombie process", "The parent crashes", "Nothing unusual happens"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "When a child exits but the parent hasn't called wait(), the child becomes a zombie — its entry remains in the process table."
    },

    /* ── Pipe programs ────────────────────────────────────── */
    {
        kind: "mcq",
        id: "OS-CODE-6",
        subject: "OS",
        unit: 2,
        topicSlug: "ipc",
        topic: "ipc",
        prompt: "What does fd[0] and fd[1] represent after calling pipe(fd)?\n\n```c\nint fd[2];\npipe(fd);\n// fd[0] = ?\n// fd[1] = ?\n```",
        options: ["fd[0] = write end, fd[1] = read end", "fd[0] = read end, fd[1] = write end", "Both are read ends", "Both are write ends"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "pipe(fd) sets fd[0] as the read end and fd[1] as the write end. Data written to fd[1] can be read from fd[0]."
    },
    {
        kind: "mcq",
        id: "OS-CODE-7",
        subject: "OS",
        unit: 2,
        topicSlug: "ipc",
        topic: "ipc",
        prompt: "What is the bug in this pipe program?\n\n```c\nint fd[2];\npipe(fd);\npid_t pid = fork();\nif (pid == 0) {\n  write(fd[1], \"hello\", 5);\n  char buf[10];\n  read(fd[0], buf, 10); // child reads\n} else {\n  char buf[10];\n  read(fd[0], buf, 10);\n}\n```",
        options: ["fork() is called before pipe()", "The child both writes and reads, causing a potential deadlock", "fd[0] and fd[1] are swapped", "The buffer size is too small"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "The child writes and then immediately tries to read from the same pipe. If the parent hasn't consumed the data and the child's read blocks, it creates a deadlock scenario. Each process should close the pipe end it doesn't use."
    },
    {
        kind: "mcq",
        id: "OS-CODE-8",
        subject: "OS",
        unit: 2,
        topicSlug: "ipc",
        topic: "ipc",
        prompt: "What will the parent read from the pipe?\n\n```c\nint fd[2];\npipe(fd);\nif (fork() == 0) {\n  close(fd[0]);\n  write(fd[1], \"OS\", 2);\n  close(fd[1]);\n  exit(0);\n}\nclose(fd[1]);\nchar buf[10];\nint n = read(fd[0], buf, 10);\nbuf[n] = '\\0';\nprintf(\"%s\\n\", buf);\n```",
        options: ["Nothing (empty string)", "OS", "Error — broken pipe", "Random data"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "The child writes \"OS\" to the pipe write end. The parent reads from the read end and gets \"OS\". Proper pipe usage: each side closes the end it doesn't need."
    },

    /* ── Bounded buffer ───────────────────────────────────── */
    {
        kind: "mcq",
        id: "OS-CODE-9",
        subject: "OS",
        unit: 2,
        topicSlug: "ipc",
        topic: "ipc",
        prompt: "In a circular bounded buffer with BUFFER_SIZE = 5, if in = 3 and out = 1, how many items are in the buffer?\n\n```c\n#define BUFFER_SIZE 5\nint count = (in - out + BUFFER_SIZE) % BUFFER_SIZE;\n```",
        options: ["3", "2", "4", "1"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "count = (3 - 1 + 5) % 5 = 7 % 5 = 2. There are 2 items in the buffer."
    },
    {
        kind: "mcq",
        id: "OS-CODE-10",
        subject: "OS",
        unit: 2,
        topicSlug: "ipc",
        topic: "ipc",
        prompt: "What is the maximum number of items that can be stored in this bounded buffer implementation?\n\n```c\n#define BUFFER_SIZE 10\nint buffer[BUFFER_SIZE];\nint in = 0, out = 0;\n\n// Buffer full condition:\n// ((in + 1) % BUFFER_SIZE) == out\n```",
        options: ["10", "9", "11", "8"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "This implementation wastes one slot to distinguish full from empty. The buffer is full when (in+1)%BUFFER_SIZE == out, so only BUFFER_SIZE - 1 = 9 items can be stored."
    },

    /* ── Semaphore / synchronization ──────────────────────── */
    {
        kind: "mcq",
        id: "OS-CODE-11",
        subject: "OS",
        unit: 2,
        topicSlug: "synchronization",
        topic: "synchronization",
        prompt: "What is wrong with this producer-consumer code?\n\n```c\nsemaphore mutex = 1;\nsemaphore empty = N;\nsemaphore full = 0;\n\n// Producer:\nwait(mutex);   // Line A\nwait(empty);   // Line B\n// ... produce item ...\nsignal(mutex);\nsignal(full);\n```",
        options: ["Nothing, it's correct", "Lines A and B are swapped — should wait(empty) before wait(mutex)", "signal(full) should come before signal(mutex)", "The mutex should be initialized to 0"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "If mutex is acquired first and the buffer is full (empty == 0), the producer holds the mutex while blocking on wait(empty). The consumer can never acquire mutex to consume, causing deadlock. Always acquire the counting semaphore before the mutex."
    },
    {
        kind: "mcq",
        id: "OS-CODE-12",
        subject: "OS",
        unit: 2,
        topicSlug: "synchronization",
        topic: "synchronization",
        prompt: "What does this semaphore code achieve?\n\n```c\nsemaphore S = 1;\n\nvoid process() {\n  wait(S);    // S becomes 0\n  // critical section\n  signal(S);  // S becomes 1\n}\n```",
        options: ["Deadlock prevention", "Mutual exclusion (mutex behavior)", "Process synchronization only", "Buffer management"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "A semaphore initialized to 1 acts as a binary semaphore / mutex. Only one process can enter the critical section at a time."
    },
    {
        kind: "mcq",
        id: "OS-CODE-13",
        subject: "OS",
        unit: 2,
        topicSlug: "synchronization",
        topic: "synchronization",
        prompt: "In Peterson's solution, what will happen if we remove the `turn` variable?\n\n```c\n// Modified (buggy) version:\nflag[i] = true;\n// turn = j;  // REMOVED\nwhile (flag[j]); // busy wait\n// critical section\nflag[i] = false;\n```",
        options: ["It still works correctly", "Mutual exclusion is violated", "Both processes may wait forever (livelock/deadlock)", "Only one process ever enters the critical section"] as [string, string, string, string],
        correctOptionIndex: 2,
        explanation: "Without the turn variable, if both processes set their flag to true simultaneously, both will spin on while(flag[j]) forever — neither can proceed. The turn variable breaks this tie."
    },
    {
        kind: "mcq",
        id: "OS-CODE-14",
        subject: "OS",
        unit: 2,
        topicSlug: "synchronization",
        topic: "synchronization",
        prompt: "What values can semaphore S take during execution with 3 processes?\n\n```c\nsemaphore S = 2; // counting semaphore\n\nvoid process() {\n  wait(S);\n  // work\n  signal(S);\n}\n```",
        options: ["Only 0 and 1", "0, 1, or 2", "-1, 0, 1, or 2", "Always 2"] as [string, string, string, string],
        correctOptionIndex: 2,
        explanation: "With 3 processes and S initialized to 2: two can enter (S goes to 0), a third waits (S goes to -1 conceptually). Values range from -1 to 2."
    },
    {
        kind: "mcq",
        id: "OS-CODE-15",
        subject: "OS",
        unit: 2,
        topicSlug: "synchronization",
        topic: "synchronization",
        prompt: "Identify the issue in this Dining Philosophers implementation:\n\n```c\nsemaphore chopstick[5]; // all initialized to 1\n\nvoid philosopher(int i) {\n  while (true) {\n    wait(chopstick[i]);\n    wait(chopstick[(i+1) % 5]);\n    // eat\n    signal(chopstick[(i+1) % 5]);\n    signal(chopstick[i]);\n  }\n}\n```",
        options: ["No issue, it works perfectly", "Deadlock can occur if all 5 pick up their left chopstick simultaneously", "Starvation only, no deadlock", "The modulo arithmetic is wrong"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "If all 5 philosophers pick up chopstick[i] simultaneously, all wait for chopstick[(i+1)%5] — circular wait causes deadlock."
    },

    /* ── Pthread code ─────────────────────────────────────── */
    {
        kind: "mcq",
        id: "OS-CODE-16",
        subject: "OS",
        unit: 2,
        topicSlug: "threads",
        topic: "threads",
        prompt: "How many threads exist in total (including main) during execution?\n\n```c\nvoid *runner(void *param) {\n  printf(\"Thread\\n\");\n  pthread_exit(0);\n}\n\nint main() {\n  pthread_t tid[3];\n  for (int i = 0; i < 3; i++)\n    pthread_create(&tid[i], NULL, runner, NULL);\n  for (int i = 0; i < 3; i++)\n    pthread_join(tid[i], NULL);\n  return 0;\n}\n```",
        options: ["3", "4", "6", "1"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "The main thread plus 3 created threads = 4 threads total. pthread_join waits for each to finish."
    },
    {
        kind: "mcq",
        id: "OS-CODE-17",
        subject: "OS",
        unit: 2,
        topicSlug: "threads",
        topic: "threads",
        prompt: "What is the potential issue with this multithreaded code?\n\n```c\nint counter = 0;\n\nvoid *increment(void *param) {\n  for (int i = 0; i < 100000; i++)\n    counter++;\n  pthread_exit(0);\n}\n\nint main() {\n  pthread_t t1, t2;\n  pthread_create(&t1, NULL, increment, NULL);\n  pthread_create(&t2, NULL, increment, NULL);\n  pthread_join(t1, NULL);\n  pthread_join(t2, NULL);\n  printf(\"%d\\n\", counter);\n}\n```",
        options: ["Always prints 200000", "Race condition — counter may be less than 200000", "Deadlock occurs", "Compilation error"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "counter++ is not atomic — it involves read, increment, and write. Two threads can interleave these operations, losing updates. This is a classic race condition."
    },
    {
        kind: "mcq",
        id: "OS-CODE-18",
        subject: "OS",
        unit: 2,
        topicSlug: "threads",
        topic: "threads",
        prompt: "What does pthread_join() do in the following code?\n\n```c\npthread_t tid;\npthread_create(&tid, NULL, runner, NULL);\npthread_join(tid, NULL);\nprintf(\"Done\\n\");\n```",
        options: ["Creates another thread", "Blocks the calling thread until the specified thread terminates", "Terminates the specified thread", "Detaches the thread"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "pthread_join() blocks the calling thread (main) until the thread identified by tid has terminated. Only then does 'Done' print."
    },

    /* ── Deadlock / Banker's algorithm ────────────────────── */
    {
        kind: "mcq",
        id: "OS-CODE-19",
        subject: "OS",
        unit: 2,
        topicSlug: "deadlocks",
        topic: "deadlocks",
        prompt: "Given: Available = [3, 3, 2], and process P1 has Need = [1, 2, 2]. Can P1's request be granted?\n\n```\nAvailable = [3, 3, 2]\nP1 Need   = [1, 2, 2]\nP1 Request= [1, 0, 2]\n```",
        options: ["No, insufficient resources", "Yes, Request ≤ Need and Request ≤ Available", "Only if no other process is waiting", "Cannot determine without Max matrix"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "Request [1,0,2] ≤ Need [1,2,2] ✓ and Request [1,0,2] ≤ Available [3,3,2] ✓. Both conditions are satisfied, so the request can be granted (pending safety check)."
    },
    {
        kind: "mcq",
        id: "OS-CODE-20",
        subject: "OS",
        unit: 2,
        topicSlug: "deadlocks",
        topic: "deadlocks",
        prompt: "Which deadlock condition does this code eliminate?\n\n```c\n// All resources are requested at once\nrequest_all(R1, R2, R3);\n// ... use resources ...\nrelease_all(R1, R2, R3);\n```",
        options: ["Mutual exclusion", "Hold and wait", "No preemption", "Circular wait"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "By requesting all resources at once (atomically), a process never holds some resources while waiting for others. This eliminates the hold-and-wait condition."
    },
    {
        kind: "mcq",
        id: "OS-CODE-21",
        subject: "OS",
        unit: 2,
        topicSlug: "deadlocks",
        topic: "deadlocks",
        prompt: "Which deadlock condition does imposing this ordering prevent?\n\n```c\n// Resource ordering: R1 < R2 < R3\n// Always acquire in order:\nlock(R1);\nlock(R2);\nlock(R3);\n// ... use resources ...\nunlock(R3);\nunlock(R2);\nunlock(R1);\n```",
        options: ["Mutual exclusion", "Hold and wait", "No preemption", "Circular wait"] as [string, string, string, string],
        correctOptionIndex: 3,
        explanation: "Total ordering on resources (always acquire in ascending order) prevents circular wait. Process A holding R1 and waiting for R2 cannot conflict with Process B holding R2 and waiting for R1 if both follow the order."
    },

    /* ── Context switch / PCB ─────────────────────────────── */
    {
        kind: "mcq",
        id: "OS-CODE-22",
        subject: "OS",
        unit: 2,
        topicSlug: "processes",
        topic: "processes",
        prompt: "During a context switch, the OS saves the current process state to its PCB. What does this pseudocode represent?\n\n```\nsave_state(current_process->PCB)\nload_state(next_process->PCB)\ncurrent_process = next_process\n```",
        options: ["Process creation", "Context switch", "System call handling", "Interrupt masking"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "This is the classic context switch: save the running process's CPU state into its PCB, load the next process's state from its PCB, and update the current process pointer."
    },

    /* ── Shared memory ────────────────────────────────────── */
    {
        kind: "mcq",
        id: "OS-CODE-23",
        subject: "OS",
        unit: 2,
        topicSlug: "ipc",
        topic: "ipc",
        prompt: "What is the issue with this shared memory code?\n\n```c\n// Process A:\nshared->data = 42;\nshared->ready = 1;\n\n// Process B:\nwhile (!shared->ready);\nprintf(\"%d\", shared->data);\n```",
        options: ["No issue, it works correctly", "Without memory barriers, the compiler/CPU may reorder operations", "Process B will crash", "shared->ready should be a semaphore type"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "Without memory barriers or volatile qualifiers, the compiler or CPU may reorder the writes in Process A or the reads in Process B, potentially reading stale data. Proper synchronization (mutex/semaphore/memory barrier) is needed."
    },

    /* ── System calls / mode switching ────────────────────── */
    {
        kind: "mcq",
        id: "OS-CODE-24",
        subject: "OS",
        unit: 1,
        topicSlug: "os-services",
        topic: "os-services",
        prompt: "What mode transition occurs when this line executes?\n\n```c\nint fd = open(\"/tmp/file.txt\", O_RDONLY);\n```",
        options: ["No mode transition", "User mode → Kernel mode → User mode", "Kernel mode → User mode", "User mode → Kernel mode (stays in kernel)"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "open() is a system call. The CPU switches from user mode to kernel mode (via trap), the kernel handles the file open, then returns to user mode."
    },

    /* ── Interrupt handling ───────────────────────────────── */
    {
        kind: "mcq",
        id: "OS-CODE-25",
        subject: "OS",
        unit: 1,
        topicSlug: "interrupts-io",
        topic: "interrupts-io",
        prompt: "What is the role of the interrupt vector in this pseudocode?\n\n```\non_interrupt(irq_number):\n  handler = interrupt_vector[irq_number]\n  save_cpu_state()\n  handler()\n  restore_cpu_state()\n```",
        options: ["It stores process PCBs", "It maps interrupt numbers to their service routines", "It contains the process ready queue", "It schedules CPU time slices"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "The interrupt vector is an array indexed by interrupt number, where each entry contains the address of the corresponding interrupt service routine (ISR)."
    },

    /* ── Wait/exec ────────────────────────────────────────── */
    {
        kind: "mcq",
        id: "OS-CODE-26",
        subject: "OS",
        unit: 2,
        topicSlug: "processes",
        topic: "processes",
        prompt: "What happens to the child process after exec() succeeds?\n\n```c\npid_t pid = fork();\nif (pid == 0) {\n  execlp(\"/bin/ls\", \"ls\", NULL);\n  printf(\"This line\");\n}\n```",
        options: ["\"This line\" is printed after ls finishes", "\"This line\" is never printed — exec replaces the process image", "The child forks again", "exec() returns to the parent"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "exec() replaces the child's entire process image with /bin/ls. The printf after exec is never reached (unless exec fails)."
    },

    /* ── Signal handling ──────────────────────────────────── */
    {
        kind: "mcq",
        id: "OS-CODE-27",
        subject: "OS",
        unit: 2,
        topicSlug: "threads",
        topic: "threads",
        prompt: "What does this signal handler setup do?\n\n```c\nvoid handle_sigint(int sig) {\n  printf(\"Caught SIGINT\\n\");\n}\n\nint main() {\n  signal(SIGINT, handle_sigint);\n  while (1) pause();\n}\n```",
        options: ["Ignores Ctrl+C", "Prints 'Caught SIGINT' when Ctrl+C is pressed instead of terminating", "Terminates on any signal", "Creates a new process for each signal"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "signal(SIGINT, handle_sigint) installs a custom handler. When the user presses Ctrl+C, instead of the default termination, handle_sigint runs and prints the message."
    },

    /* ── Amdahl's law calculation ─────────────────────────── */
    {
        kind: "mcq",
        id: "OS-CODE-28",
        subject: "OS",
        unit: 2,
        topicSlug: "threads",
        topic: "threads",
        prompt: "Using Amdahl's Law, what is the maximum speedup with 4 cores if 50% of the program is serial?\n\n```\nSpeedup = 1 / (S + (1-S)/N)\nS = 0.5, N = 4\n```",
        options: ["4x", "2x", "1.6x", "1.33x"] as [string, string, string, string],
        correctOptionIndex: 2,
        explanation: "Speedup = 1 / (0.5 + 0.5/4) = 1 / (0.5 + 0.125) = 1 / 0.625 = 1.6x"
    },

    /* ── DMA / I/O ────────────────────────────────────────── */
    {
        kind: "mcq",
        id: "OS-CODE-29",
        subject: "OS",
        unit: 1,
        topicSlug: "interrupts-io",
        topic: "interrupts-io",
        prompt: "In this DMA transfer pseudocode, what is the CPU doing during Step 2?\n\n```\nStep 1: CPU sets up DMA (source, dest, count)\nStep 2: DMA controller transfers data block\nStep 3: DMA controller sends interrupt to CPU\nStep 4: CPU handles completion interrupt\n```",
        options: ["Waiting idle for DMA", "Free to execute other processes", "Transferring data byte-by-byte", "Polling the DMA controller"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "DMA's key advantage: the CPU is free to execute other work while the DMA controller handles the data transfer. The CPU is only interrupted when the transfer completes."
    },

    /* ── Mutex with pthreads ──────────────────────────────── */
    {
        kind: "mcq",
        id: "OS-CODE-30",
        subject: "OS",
        unit: 2,
        topicSlug: "synchronization",
        topic: "synchronization",
        prompt: "What does this code correctly prevent?\n\n```c\npthread_mutex_t lock;\nint counter = 0;\n\nvoid *increment(void *arg) {\n  for (int i = 0; i < 100000; i++) {\n    pthread_mutex_lock(&lock);\n    counter++;\n    pthread_mutex_unlock(&lock);\n  }\n}\n```",
        options: ["Deadlock", "Race condition on the shared counter", "Starvation", "Priority inversion"] as [string, string, string, string],
        correctOptionIndex: 1,
        explanation: "The mutex ensures only one thread increments counter at a time, preventing the race condition where concurrent counter++ operations lose updates."
    }
];
