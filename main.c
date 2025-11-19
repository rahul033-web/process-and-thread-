#include <stdio.h>
#include "../include/scheduler.h"


int main() {
    int n, choice, quantum;

    printf("Enter number of processes: ");
    scanf("%d", &n);
    Process p[n];

    for (int i = 0; i < n; i++) {
        p[i].pid = i + 1;
        printf("Enter Arrival Time, Burst Time, Priority for P%d: ", i + 1);
        scanf("%d %d %d", &p[i].arrival_time, &p[i].burst_time, &p[i].priority);
    }

    printf("Select Scheduling Algorithm:\n");
printf("1. FCFS\n2. SJF\n3. Round Robin\n4. Priority\n");
printf("Enter choice: ");


    scanf("%d", &choice);

    switch (choice) {
        case 1: fcfs(p, n); break;
        case 2: sjf(p, n); break;
        case 3: priorityScheduling(p, n); break;
        case 4:
            printf("Enter time quantum: ");
            scanf("%d", &quantum);
            roundRobin(p, n, quantum);
            break;
            

        default: printf("Invalid choice!\n");
    }

    return 0;
}
