#ifndef PROCESS_CONTROL_H
#define PROCESS_CONTROL_H

typedef struct {
    int pid;
    int arrival_time;
    int burst_time;
    int priority;
    int remaining_time;
} Process;

void display_processes(Process p[], int n);

#endif
