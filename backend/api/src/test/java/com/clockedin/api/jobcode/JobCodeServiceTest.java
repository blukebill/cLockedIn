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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobCodeServiceTest {

    @Mock
    private JobCodeRepository jobCodeRepository;

    @Mock
    private EmployeeJobCodeRepository employeeJobCodeRepository;

    @Mock
    private RestaurantRepository restaurantRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private JobCodeService service;

    @Test
    void upsertNormalizesJobCodeNamesToUppercase() {
        Restaurant restaurant = restaurant(1L);
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant));
        when(jobCodeRepository.existsByRestaurantIdAndName(1L, "COOK")).thenReturn(false);
        when(jobCodeRepository.findMaxRankByRestaurantId(1L)).thenReturn(0);
        when(jobCodeRepository.save(any(JobCode.class))).thenAnswer(invocation -> {
            JobCode jobCode = invocation.getArgument(0);
            jobCode.setId(10L);
            return jobCode;
        });

        JobCodeResponse response = service.upsertJobCode(1L, upsertRequest(null, " cook ", 1));

        assertThat(response.name()).isEqualTo("COOK");
        assertThat(response.rank()).isEqualTo(1);
    }

    @Test
    void uniqueNamePerRestaurantIsEnforced() {
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant(1L)));
        when(jobCodeRepository.existsByRestaurantIdAndName(1L, "COOK")).thenReturn(true);

        assertThatThrownBy(() -> service.upsertJobCode(1L, upsertRequest(null, "cook", 1)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Job code name already in use");
    }

    @Test
    void insertShiftsExistingRanksAtOrAboveRequestedRank() {
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant(1L)));
        when(jobCodeRepository.existsByRestaurantIdAndName(1L, "COOK")).thenReturn(false);
        when(jobCodeRepository.findMaxRankByRestaurantId(1L)).thenReturn(5);
        when(jobCodeRepository.save(any(JobCode.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.upsertJobCode(1L, upsertRequest(null, "cook", 4));

        verify(jobCodeRepository).offsetRanksAtOrAbove(1L, 4, 1005);
        verify(jobCodeRepository).normalizeOffsetRanksAtOrAbove(1L, 1009, 1005, 1);
    }

    @Test
    void sameNameAndRankAcrossDifferentRestaurantsIsAllowedByRestaurantScopedChecks() {
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant(1L)));
        when(restaurantRepository.findById(2L)).thenReturn(Optional.of(restaurant(2L)));
        when(jobCodeRepository.findMaxRankByRestaurantId(1L)).thenReturn(0);
        when(jobCodeRepository.findMaxRankByRestaurantId(2L)).thenReturn(0);
        when(jobCodeRepository.save(any(JobCode.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.upsertJobCode(1L, upsertRequest(null, "cook", 1));
        service.upsertJobCode(2L, upsertRequest(null, "cook", 1));

        verify(jobCodeRepository).existsByRestaurantIdAndName(1L, "COOK");
        verify(jobCodeRepository).existsByRestaurantIdAndName(2L, "COOK");
    }

    @Test
    void updatingJobCodeToLowerRankShiftsIntermediateRanksUp() {
        Restaurant restaurant = restaurant(1L);
        JobCode jobCode = jobCode(10L, restaurant, "BAR", 5);
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant));
        when(jobCodeRepository.findByIdAndRestaurantId(10L, 1L)).thenReturn(Optional.of(jobCode));
        when(jobCodeRepository.existsByRestaurantIdAndNameAndIdNot(1L, "BAR", 10L)).thenReturn(false);
        when(jobCodeRepository.findMaxRankByRestaurantId(1L)).thenReturn(5);
        when(jobCodeRepository.saveAndFlush(jobCode)).thenReturn(jobCode);
        when(jobCodeRepository.save(jobCode)).thenReturn(jobCode);

        JobCodeResponse response = service.upsertJobCode(1L, upsertRequest(10L, "bar", 3));

        assertThat(response.rank()).isEqualTo(3);
        verify(jobCodeRepository).offsetRanksBetween(1L, 3, 4, 1005);
        verify(jobCodeRepository).normalizeOffsetRanksBetween(1L, 1008, 1009, 1005, 1);
    }

    @Test
    void updatingJobCodeToHigherRankShiftsIntermediateRanksDown() {
        Restaurant restaurant = restaurant(1L);
        JobCode jobCode = jobCode(10L, restaurant, "RUNNER", 2);
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(restaurant));
        when(jobCodeRepository.findByIdAndRestaurantId(10L, 1L)).thenReturn(Optional.of(jobCode));
        when(jobCodeRepository.existsByRestaurantIdAndNameAndIdNot(1L, "RUNNER", 10L)).thenReturn(false);
        when(jobCodeRepository.findMaxRankByRestaurantId(1L)).thenReturn(5);
        when(jobCodeRepository.saveAndFlush(jobCode)).thenReturn(jobCode);
        when(jobCodeRepository.save(jobCode)).thenReturn(jobCode);

        JobCodeResponse response = service.upsertJobCode(1L, upsertRequest(10L, "runner", 4));

        assertThat(response.rank()).isEqualTo(4);
        verify(jobCodeRepository).offsetRanksBetween(1L, 3, 4, 1005);
        verify(jobCodeRepository).normalizeOffsetRanksBetween(1L, 1008, 1009, 1005, -1);
    }

    @Test
    void assignmentValidatesEmployeeMembership() {
        when(userRepository.findByIdAndRestaurantId(5L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.assignEmployeeJobCode(1L, 5L, assignRequest(10L)))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Employee not found");
    }

    @Test
    void assignmentValidatesJobCodeBelongsToRestaurant() {
        User employee = user(5L, restaurant(1L), Role.EMPLOYEE);
        when(userRepository.findByIdAndRestaurantId(5L, 1L)).thenReturn(Optional.of(employee));
        when(jobCodeRepository.findByIdAndRestaurantId(10L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.assignEmployeeJobCode(1L, 5L, assignRequest(10L)))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Job code not found");
    }

    @Test
    void multipleJobCodesPerEmployeeAreSupported() {
        Restaurant restaurant = restaurant(1L);
        User employee = user(5L, restaurant, Role.EMPLOYEE);
        JobCode cook = jobCode(10L, restaurant, "COOK", 1);
        JobCode server = jobCode(11L, restaurant, "SERVER", 2);
        when(userRepository.findByIdAndRestaurantId(5L, 1L)).thenReturn(Optional.of(employee));
        when(jobCodeRepository.findByIdAndRestaurantId(10L, 1L)).thenReturn(Optional.of(cook));
        when(jobCodeRepository.findByIdAndRestaurantId(11L, 1L)).thenReturn(Optional.of(server));
        when(employeeJobCodeRepository.findByRestaurantIdAndEmployeeIdAndJobCodeId(any(), any(), any()))
                .thenReturn(Optional.empty());
        when(employeeJobCodeRepository.save(any(EmployeeJobCode.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EmployeeJobCodeResponse first = service.assignEmployeeJobCode(1L, 5L, assignRequest(10L));
        EmployeeJobCodeResponse second = service.assignEmployeeJobCode(1L, 5L, assignRequest(11L));

        assertThat(first.jobCodeName()).isEqualTo("COOK");
        assertThat(second.jobCodeName()).isEqualTo("SERVER");
    }

    @Test
    void removeEmployeeJobCodeDeletesOnlyIntendedAssociation() {
        Restaurant restaurant = restaurant(1L);
        User employee = user(5L, restaurant, Role.EMPLOYEE);
        JobCode jobCode = jobCode(10L, restaurant, "COOK", 1);
        EmployeeJobCode assignment = assignment(20L, employee, jobCode);
        when(userRepository.findByIdAndRestaurantId(5L, 1L)).thenReturn(Optional.of(employee));
        when(jobCodeRepository.findByIdAndRestaurantId(10L, 1L)).thenReturn(Optional.of(jobCode));
        when(employeeJobCodeRepository.findByRestaurantIdAndEmployeeIdAndJobCodeId(1L, 5L, 10L))
                .thenReturn(Optional.of(assignment));

        service.removeEmployeeJobCode(1L, 5L, 10L);

        verify(employeeJobCodeRepository).delete(assignment);
    }

    @Test
    void deleteJobCodeDeletesRestaurantScopedJobCode() {
        Restaurant restaurant = restaurant(1L);
        JobCode jobCode = jobCode(10L, restaurant, "COOK", 1);
        when(jobCodeRepository.findByIdAndRestaurantId(10L, 1L)).thenReturn(Optional.of(jobCode));
        when(jobCodeRepository.findMaxRankByRestaurantId(1L)).thenReturn(5);

        service.deleteJobCode(1L, 10L);

        verify(jobCodeRepository).delete(jobCode);
        verify(jobCodeRepository).flush();
        verify(jobCodeRepository).offsetRanksAtOrAbove(1L, 2, 1005);
        verify(jobCodeRepository).normalizeOffsetRanksAtOrAbove(1L, 1007, 1005, -1);
    }

    @Test
    void employeeAssignmentListingIsScopedToRestaurantAndEmployee() {
        service.getEmployeeJobCodes(1L);
        when(userRepository.findByIdAndRestaurantId(5L, 1L)).thenReturn(Optional.of(user(5L, restaurant(1L), Role.EMPLOYEE)));
        when(employeeJobCodeRepository.findByRestaurantIdAndEmployeeIdOrderByJobCodeRankAsc(1L, 5L)).thenReturn(List.of());

        service.getEmployeeJobCodes(1L, 5L);

        verify(employeeJobCodeRepository).findByRestaurantIdOrderByEmployeeIdAsc(1L);
        verify(employeeJobCodeRepository).findByRestaurantIdAndEmployeeIdOrderByJobCodeRankAsc(1L, 5L);
    }

    private UpsertJobCodeRequest upsertRequest(Long id, String name, int rank) {
        UpsertJobCodeRequest request = new UpsertJobCodeRequest();
        request.setId(id);
        request.setName(name);
        request.setRank(rank);
        return request;
    }

    private AssignEmployeeJobCodeRequest assignRequest(Long jobCodeId) {
        AssignEmployeeJobCodeRequest request = new AssignEmployeeJobCodeRequest();
        request.setJobCodeId(jobCodeId);
        return request;
    }

    private EmployeeJobCode assignment(Long id, User employee, JobCode jobCode) {
        EmployeeJobCode assignment = new EmployeeJobCode();
        assignment.setId(id);
        assignment.setRestaurant(employee.getRestaurant());
        assignment.setEmployee(employee);
        assignment.setJobCode(jobCode);
        return assignment;
    }

    private JobCode jobCode(Long id, Restaurant restaurant, String name, int rank) {
        JobCode jobCode = new JobCode();
        jobCode.setId(id);
        jobCode.setRestaurant(restaurant);
        jobCode.setName(name);
        jobCode.setRank(rank);
        return jobCode;
    }

    private Restaurant restaurant(Long id) {
        Restaurant restaurant = new Restaurant();
        restaurant.setId(id);
        restaurant.setName("Restaurant " + id);
        return restaurant;
    }

    private User user(Long id, Restaurant restaurant, Role role) {
        User user = new User();
        user.setId(id);
        user.setName("User " + id);
        user.setEmail("user" + id + "@example.com");
        user.setRole(role);
        user.setRestaurant(restaurant);
        return user;
    }
}
