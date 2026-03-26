package com.clockedin.api.availability.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;

public class AvailabilityResponse {

    private Long id;
    private Long employeeId;
    private String employeeName;
    private DayOfWeek dayOfWeek;
    private boolean available;
    private LocalTime startTime;
    private LocalTime endTime;

    public AvailabilityResponse() {
    }

    public AvailabilityResponse(
            Long id,
            Long employeeId,
            String employeeName,
            DayOfWeek dayOfWeek,
            boolean available,
            LocalTime startTime,
            LocalTime endTime
    ) {
        this.id = id;
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.dayOfWeek = dayOfWeek;
        this.available = available;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public Long getId() {
        return id;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public DayOfWeek getDayOfWeek() {
        return dayOfWeek;
    }

    public boolean isAvailable() {
        return available;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }
}
