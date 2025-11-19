#include <stdio.h>
#include <windows.h> // for Sleep()
#include "thread_control.h"

// Simulate thread creation (without pthread)
void create_threads(ThreadData threads[], Process p[], int n) {
    for (int i = 0; i < n; i++) {
        threads[i].tid = i + 1;
        threads[i].process = p[i];
        printf("🧵 Thread %d created for Process %d\n", threads[i].tid, p[i].pid);
    }
}

// Simulate process execution
void execute_process(ThreadData *t) {
    printf("▶️ Executing Process %d (Burst: %d)\n", t->process.pid, t->process.burst_time);
    Sleep(t->process.burst_time * 200); // simulate time
    printf("✅ Process %d completed\n", t->process.pid);
}

// Simulate joining threads
void join_threads(ThreadData threads[], int n) {
    for (int i = 0; i < n; i++) {
        execute_process(&threads[i]);
    }
}

