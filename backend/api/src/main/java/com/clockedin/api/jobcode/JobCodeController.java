package com.clockedin.api.jobcode;

import com.clockedin.api.auth.CustomUserDetails;
import com.clockedin.api.jobcode.dto.AssignEmployeeJobCodeRequest;
import com.clockedin.api.jobcode.dto.EmployeeJobCodeResponse;
import com.clockedin.api.jobcode.dto.JobCodeResponse;
import com.clockedin.api.jobcode.dto.UpsertJobCodeRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class JobCodeController {

    private final JobCodeService jobCodeService;

    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping("/job-codes")
    public List<JobCodeResponse> getJobCodes(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return jobCodeService.getJobCodes(userDetails.getRestaurantId());
    }

    @PreAuthorize("hasRole('MANAGER')")
    @PutMapping("/job-codes")
    public JobCodeResponse upsertJobCode(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpsertJobCodeRequest request
    ) {
        return jobCodeService.upsertJobCode(userDetails.getRestaurantId(), request);
    }

    @PreAuthorize("hasRole('MANAGER')")
    @DeleteMapping("/job-codes/{jobCodeId}")
    public void deleteJobCode(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long jobCodeId
    ) {
        jobCodeService.deleteJobCode(userDetails.getRestaurantId(), jobCodeId);
    }

    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping("/employee-job-codes")
    public List<EmployeeJobCodeResponse> getEmployeeJobCodes(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return jobCodeService.getEmployeeJobCodes(userDetails.getRestaurantId());
    }

    @PreAuthorize("hasRole('MANAGER')")
    @GetMapping("/employee-job-codes/employee/{employeeId}")
    public List<EmployeeJobCodeResponse> getEmployeeJobCodesForEmployee(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long employeeId
    ) {
        return jobCodeService.getEmployeeJobCodes(userDetails.getRestaurantId(), employeeId);
    }

    @PreAuthorize("hasRole('MANAGER')")
    @PutMapping("/employee-job-codes/employee/{employeeId}")
    public EmployeeJobCodeResponse assignEmployeeJobCode(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long employeeId,
            @Valid @RequestBody AssignEmployeeJobCodeRequest request
    ) {
        return jobCodeService.assignEmployeeJobCode(
                userDetails.getRestaurantId(),
                employeeId,
                request
        );
    }

    @PreAuthorize("hasRole('MANAGER')")
    @DeleteMapping("/employee-job-codes/employee/{employeeId}/job-code/{jobCodeId}")
    public void removeEmployeeJobCode(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long employeeId,
            @PathVariable Long jobCodeId
    ) {
        jobCodeService.removeEmployeeJobCode(
                userDetails.getRestaurantId(),
                employeeId,
                jobCodeId
        );
    }
}
