#include <stdio.h>
#include "scheduler.h"

void fcfs(Process p[], int n) {
    int total_wt = 0, total_tat = 0;
    p[0].waiting_time = 0;
    p[0].turnaround_time = p[0].burst_time;

    for (int i = 1; i < n; i++) {
        p[i].waiting_time = p[i - 1].waiting_time + p[i - 1].burst_time;
        p[i].turnaround_time = p[i].waiting_time + p[i].burst_time;
    }

    printf("\nFCFS Scheduling:\nPID\tWT\tTAT\n");
    for (int i = 0; i < n; i++) {
        printf("%d\t%d\t%d\n", p[i].pid, p[i].waiting_time, p[i].turnaround_time);
        total_wt += p[i].waiting_time;
        total_tat += p[i].turnaround_time;
    }

    printf("Avg WT = %.2f, Avg TAT = %.2f\n", (float)total_wt/n, (float)total_tat/n);
}

void sjf(Process p[], int n) {
    Process temp;
    for (int i = 0; i < n - 1; i++) {
        for (int j = i + 1; j < n; j++) {
            if (p[i].burst_time > p[j].burst_time) {
                temp = p[i];
                p[i] = p[j];
                p[j] = temp;
            }
        }
    }
    fcfs(p, n);
}

void priorityScheduling(Process p[], int n) {
    Process temp;
    for (int i = 0; i < n - 1; i++) {
        for (int j = i + 1; j < n; j++) {
            if (p[i].priority > p[j].priority) {
                temp = p[i];
                p[i] = p[j];
                p[j] = temp;
            }
        }
    }
    fcfs(p, n);
}

void roundRobin(Process p[], int n, int quantum) {
    int rem_bt[n];
    for (int i = 0; i < n; i++) rem_bt[i] = p[i].burst_time;
    int t = 0;

    printf("\nRound Robin Scheduling:\n");
    while (1) {
        int done = 1;
        for (int i = 0; i < n; i++) {
            if (rem_bt[i] > 0) {
                done = 0;
                if (rem_bt[i] > quantum) {
                    t += quantum;
                    rem_bt[i] -= quantum;
                } else {
                    t += rem_bt[i];
                    p[i].waiting_time = t - p[i].burst_time;
                    rem_bt[i] = 0;
                }
            }
        }
        if (done) break;
    }

    for (int i = 0; i < n; i++)
        p[i].turnaround_time = p[i].burst_time + p[i].waiting_time;

    printf("PID\tWT\tTAT\n");
    for (int i = 0; i < n; i++)
        printf("%d\t%d\t%d\n", p[i].pid, p[i].waiting_time, p[i].turnaround_time);
}
