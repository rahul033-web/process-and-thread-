#include <stdio.h>

#include <stdlib.h>

#include "../include/scheduler.h"

#include "../include/thread_control.h"

int main() {

    int n;

    int choice;

    int quantum;

    scanf(
        "%d",
        &n
    );
    Process p[
        n
    ];
    for (
        int i = 0;
        i < n;
        i++
    ) {
        p[i].pid =
            i + 1;
        scanf(
            "%d %d %d",

            &p[i].arrival_time,

            &p[i].burst_time,

            &p[i].priority
            
        );
    }
    scanf(
        "%d",
        &choice
    );
    switch (
        choice
    ) {
        case 1:
            fcfs(
                p,
                n
            );
            break;
        case 2:
            sjf(
                p,
                n
            );
            break;
        case 3:
            priorityScheduling(
                p,
                n
            );
            break;
        case 4:
            scanf(
                "%d",
                &quantum
            );
            roundRobin(
                p,
                n,
                quantum
            );
            break;
        default:
            printf(
                "{\"error\":\"Invalid Choice\"}"
            );
            return
                0;
    }
    print_json(
        p,
        n
    );
    return
        0;
}
