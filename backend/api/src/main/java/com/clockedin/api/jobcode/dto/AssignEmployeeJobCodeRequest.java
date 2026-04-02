package com.clockedin.api.jobcode.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AssignEmployeeJobCodeRequest {

    @NotNull
    private Long jobCodeId;
}
