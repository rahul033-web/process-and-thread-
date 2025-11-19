#ifndef THREAD_CONTROL_H
#define THREAD_CONTROL_H

#include "process_control.h"

// Dummy thread structure for simulation (no pthread needed)
typedef struct {
    int tid;
    Process process;
} ThreadData;

// Function declarations
void create_threads(ThreadData threads[], Process p[], int n);
void execute_process(ThreadData *t);
void join_threads(ThreadData threads[], int n);

#endif
