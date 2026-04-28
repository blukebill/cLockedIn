package com.clockedin.api.schedule.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
public class UpsertShiftTemplateRequest {

    private Long id;

    @NotNull
    private Long jobCodeId;

    @NotNull
    private DayOfWeek dayOfWeek;

    @NotBlank
    @Size(max = 100)
    private String name;

    @NotNull
    private LocalTime startTime;

    @NotNull
    private LocalTime endTime;

    @NotNull
    @Min(0)
    private Integer minEmployees;

    @NotNull
    @Min(1)
    private Integer maxEmployees;

    @NotNull
    private Boolean active;
}
