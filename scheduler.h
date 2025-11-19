#ifndef SCHEDULER_H
#define SCHEDULER_H

typedef struct {
    int pid;
    int arrival_time;
    int burst_time;
    int priority;
    int waiting_time;
    int turnaround_time;
} Process;

void fcfs(Process p[], int n);
void sjf(Process p[], int n);
void priorityScheduling(Process p[], int n);
void roundRobin(Process p[], int n, int quantum);


#endif
