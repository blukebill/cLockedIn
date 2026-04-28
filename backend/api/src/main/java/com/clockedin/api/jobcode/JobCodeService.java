package com.clockedin.api.jobcode;

import com.clockedin.api.jobcode.dto.AssignEmployeeJobCodeRequest;
import com.clockedin.api.jobcode.dto.EmployeeJobCodeResponse;
import com.clockedin.api.jobcode.dto.JobCodeResponse;
import com.clockedin.api.jobcode.dto.UpsertJobCodeRequest;
import com.clockedin.api.restaurant.Restaurant;
import com.clockedin.api.restaurant.RestaurantRepository;
import com.clockedin.api.user.Role;
import com.clockedin.api.user.User;
import com.clockedin.api.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobCodeService {
    private static final int RANK_OFFSET_BUFFER = 1000;

    private final JobCodeRepository jobCodeRepository;
    private final EmployeeJobCodeRepository employeeJobCodeRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    public List<JobCodeResponse> getJobCodes(Long restaurantId) {
        return jobCodeRepository.findByRestaurantIdOrderByRankAsc(restaurantId)
                .stream()
                .map(this::toJobCodeResponse)
                .toList();
    }

    @Transactional
    public JobCodeResponse upsertJobCode(Long restaurantId, UpsertJobCodeRequest request) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Restaurant not found"));

        String normalizedName = normalizeRoleName(request.getName());

        JobCode jobCode;
        if (request.getId() != null) {
            jobCode = jobCodeRepository.findByIdAndRestaurantId(request.getId(), restaurantId)
                    .orElseThrow(() -> new EntityNotFoundException("Job code not found"));

            if (jobCodeRepository.existsByRestaurantIdAndNameAndIdNot(restaurantId, normalizedName, jobCode.getId())) {
                throw new IllegalArgumentException("Job code name already in use");
            }

            moveExistingRankIfNeeded(restaurantId, jobCode, request.getRank());
        } else {
            if (jobCodeRepository.existsByRestaurantIdAndName(restaurantId, normalizedName)) {
                throw new IllegalArgumentException("Job code name already in use");
            }

            openRankForInsert(restaurantId, request.getRank());
            jobCode = new JobCode();
            jobCode.setRestaurant(restaurant);
        }

        jobCode.setName(normalizedName);
        jobCode.setRank(request.getRank());

        return toJobCodeResponse(jobCodeRepository.save(jobCode));
    }

    @Transactional
    public void deleteJobCode(Long restaurantId, Long jobCodeId) {
        JobCode jobCode = jobCodeRepository.findByIdAndRestaurantId(jobCodeId, restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Job code not found"));
        Integer deletedRank = jobCode.getRank();

        jobCodeRepository.delete(jobCode);
        jobCodeRepository.flush();
        closeRankAfterDelete(restaurantId, deletedRank);
    }

    @Transactional(readOnly = true)
    public List<EmployeeJobCodeResponse> getEmployeeJobCodes(Long restaurantId) {
        return employeeJobCodeRepository.findByRestaurantIdOrderByEmployeeIdAsc(restaurantId)
                .stream()
                .map(this::toEmployeeJobCodeResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EmployeeJobCodeResponse> getEmployeeJobCodes(Long restaurantId, Long employeeId) {
        getEmployeeForRestaurant(employeeId, restaurantId);

        return employeeJobCodeRepository.findByRestaurantIdAndEmployeeIdOrderByJobCodeRankAsc(restaurantId, employeeId)
                .stream()
                .map(this::toEmployeeJobCodeResponse)
                .toList();
    }

    @Transactional
    public EmployeeJobCodeResponse assignEmployeeJobCode(
            Long restaurantId,
            Long employeeId,
            AssignEmployeeJobCodeRequest request
    ) {
        User employee = getEmployeeForRestaurant(employeeId, restaurantId);
        JobCode jobCode = jobCodeRepository.findByIdAndRestaurantId(request.getJobCodeId(), restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Job code not found"));

        EmployeeJobCode assignment = employeeJobCodeRepository.findByRestaurantIdAndEmployeeIdAndJobCodeId(
                        restaurantId,
                        employeeId,
                        jobCode.getId()
                )
                .orElseGet(EmployeeJobCode::new);

        assignment.setRestaurant(employee.getRestaurant());
        assignment.setEmployee(employee);
        assignment.setJobCode(jobCode);

        return toEmployeeJobCodeResponse(employeeJobCodeRepository.save(assignment));
    }

    @Transactional
    public void removeEmployeeJobCode(Long restaurantId, Long employeeId, Long jobCodeId) {
        getEmployeeForRestaurant(employeeId, restaurantId);
        jobCodeRepository.findByIdAndRestaurantId(jobCodeId, restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Job code not found"));

        EmployeeJobCode assignment = employeeJobCodeRepository.findByRestaurantIdAndEmployeeIdAndJobCodeId(
                        restaurantId,
                        employeeId,
                        jobCodeId
                )
                .orElseThrow(() -> new EntityNotFoundException("Employee job code assignment not found"));

        employeeJobCodeRepository.delete(assignment);
    }

    private User getEmployeeForRestaurant(Long employeeId, Long restaurantId) {
        User employee = userRepository.findByIdAndRestaurantId(employeeId, restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));

        if (employee.getRole() != Role.EMPLOYEE) {
            throw new EntityNotFoundException("Employee not found");
        }

        return employee;
    }

    private JobCodeResponse toJobCodeResponse(JobCode jobCode) {
        return new JobCodeResponse(
                jobCode.getId(),
                jobCode.getName(),
                jobCode.getRank()
        );
    }

    private EmployeeJobCodeResponse toEmployeeJobCodeResponse(EmployeeJobCode assignment) {
        return new EmployeeJobCodeResponse(
                assignment.getId(),
                assignment.getEmployee().getId(),
                assignment.getEmployee().getName(),
                assignment.getJobCode().getId(),
                assignment.getJobCode().getName(),
                assignment.getJobCode().getRank()
        );
    }

    private String normalizeRoleName(String value) {
        return value.trim().toUpperCase();
    }

    private void openRankForInsert(Long restaurantId, Integer rank) {
        int offset = rankOffset(restaurantId);
        jobCodeRepository.offsetRanksAtOrAbove(restaurantId, rank, offset);
        jobCodeRepository.normalizeOffsetRanksAtOrAbove(restaurantId, rank + offset, offset, 1);
    }

    private void closeRankAfterDelete(Long restaurantId, Integer deletedRank) {
        int offset = rankOffset(restaurantId);
        int firstRankAboveDeleted = deletedRank + 1;
        jobCodeRepository.offsetRanksAtOrAbove(restaurantId, firstRankAboveDeleted, offset);
        jobCodeRepository.normalizeOffsetRanksAtOrAbove(
                restaurantId,
                firstRankAboveDeleted + offset,
                offset,
                -1
        );
    }

    private void moveExistingRankIfNeeded(Long restaurantId, JobCode jobCode, Integer newRank) {
        Integer currentRank = jobCode.getRank();
        if (currentRank.equals(newRank)) {
            return;
        }

        int offset = rankOffset(restaurantId);
        jobCode.setRank(currentRank + offset);
        jobCodeRepository.saveAndFlush(jobCode);

        if (newRank < currentRank) {
            shiftRanksUpBetween(restaurantId, newRank, currentRank - 1, offset);
        } else {
            shiftRanksDownBetween(restaurantId, currentRank + 1, newRank, offset);
        }
    }

    private void shiftRanksUpBetween(Long restaurantId, Integer startRank, Integer endRank, Integer offset) {
        if (startRank > endRank) {
            return;
        }

        jobCodeRepository.offsetRanksBetween(restaurantId, startRank, endRank, offset);
        jobCodeRepository.normalizeOffsetRanksBetween(
                restaurantId,
                startRank + offset,
                endRank + offset,
                offset,
                1
        );
    }

    private void shiftRanksDownBetween(Long restaurantId, Integer startRank, Integer endRank, Integer offset) {
        if (startRank > endRank) {
            return;
        }

        jobCodeRepository.offsetRanksBetween(restaurantId, startRank, endRank, offset);
        jobCodeRepository.normalizeOffsetRanksBetween(
                restaurantId,
                startRank + offset,
                endRank + offset,
                offset,
                -1
        );
    }

    private int rankOffset(Long restaurantId) {
        return jobCodeRepository.findMaxRankByRestaurantId(restaurantId) + RANK_OFFSET_BUFFER;
    }
}
