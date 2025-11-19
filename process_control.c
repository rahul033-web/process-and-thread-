#include <stdio.h>
#include "process_control.h"

void display_processes(Process p[], int n) {
    printf("\nPID\tArrival\tBurst\tPriority\n");
    for (int i = 0; i < n; i++) {
        printf("%d\t%d\t%d\t%d\n", p[i].pid, p[i].arrival_time, p[i].burst_time, p[i].priority);
    }
}
