package com.clockedin.api.jobcode.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpsertJobCodeRequest {

    private Long id;

    @NotBlank
    @Size(max = 100)
    private String name;

    @NotNull
    @Min(value = 1, message = "rank must be at least 1")
    private Integer rank;
}
