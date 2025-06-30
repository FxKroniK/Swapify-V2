package com.example.demo.controllers;

import com.example.demo.clients.AuthClient;
import com.example.demo.dtos.*;
import com.example.demo.entities.User;
import com.example.demo.interfaces.CreditHistoryService;
import com.example.demo.interfaces.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:4200") // TODO: Implementar archivo de seguridad y quitar esta etiqueta
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final CreditHistoryService creditHistoryService;
    private final AuthClient authClient;

    public UserController(UserService userService, CreditHistoryService creditHistoryService, AuthClient authClient) {
        this.userService = userService;
        this.creditHistoryService = creditHistoryService;
        this.authClient = authClient;
    }

    @GetMapping("/internal/{id}")
    public ResponseEntity<UserDto> getUserInternal(@PathVariable Long id) {
        try {
            UserDto dto = userService.getUser(id);  // Ajusta según tu DTO
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable Long id, @RequestHeader("Authorization") String token) {
        try {
            UserInfoDto userInfo = authClient.validateUserToken(token.replace("Bearer ", "")).block();
            if (userInfo == null || !userInfo.getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            UserDto user = userService.getUser(id);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            System.out.println("Error al obtener usuario: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @GetMapping("/profile/{id}")
    public ResponseEntity<UserProfileDto> getUserProfileById(@PathVariable Long id, @RequestHeader("Authorization") String token) {
        try {
            UserInfoDto userInfo = authClient.validateUserToken(token.replace("Bearer ", "")).block();
            if (userInfo == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            UserProfileDto profile = userService.getUserProfile(id);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            System.out.println("Error al obtener el perfil por ID: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Void> updateUser(@PathVariable Long id, @RequestBody UpdateUserDto dto, @RequestHeader("Authorization") String token) {
        try {
            UserInfoDto userInfo = authClient.validateUserToken(token.replace("Bearer ", "")).block();
            if (userInfo == null || !userInfo.getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            userService.updateUser(id, dto);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.out.println("Error al actualizar usuario: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/{id}/credits")
    public ResponseEntity<Void> addCredits(@PathVariable Long id, @RequestBody CreditRequestDto dto, @RequestHeader("Authorization") String token) {
        try {
            UserInfoDto userInfo = authClient.validateUserToken(token.replace("Bearer ", "")).block();
            if (userInfo == null || !userInfo.getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            creditHistoryService.addCredits(id, dto);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.out.println("Error al añadir créditos: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @GetMapping("/{id}/credits/history")
    public ResponseEntity<List<CreditHistoryDto>> getCreditHistory(@PathVariable Long id, @RequestHeader("Authorization") String token) {
        try {
            UserInfoDto userInfo = authClient.validateUserToken(token.replace("Bearer ", "")).block();
            if (userInfo == null || !userInfo.getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            List<CreditHistoryDto> history = creditHistoryService.getCreditHistory(id);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            System.out.println("Error al obtener historial de créditos: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/create")
    public ResponseEntity<UserDto> createUser(@RequestHeader("Authorization") String token) {
        try {
            UserInfoDto respuesta = authClient.validateUserToken(token.replace("Bearer ", "")).block();
            if (respuesta == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            UserDto user = userService.createUser(respuesta);
            return new ResponseEntity<>(user, HttpStatus.CREATED);
        } catch (Exception e) {
            System.out.println("Error al crear usuario: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> getCurrentUserProfile(@RequestHeader("Authorization") String token) {
        try {
            UserInfoDto userInfo = authClient.validateUserToken(token.replace("Bearer ", "")).block();
            if (userInfo == null || userInfo.getUseremail() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            UserProfileDto profileDto = userService.getUserProfileByEmail(userInfo.getUseremail());
            return ResponseEntity.ok(profileDto);
        } catch (Exception e) {
            System.out.println("Excepción al obtener el perfil: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @GetMapping("/by-email")
    public ResponseEntity<UserDto> getUserByEmail(
            @RequestParam String email,
            @RequestHeader("Authorization") String token) {
        try {
            UserInfoDto userInfo = authClient.validateUserToken(token.replace("Bearer ", "")).block();
            if (userInfo == null || !userInfo.getUseremail().equals(email)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            UserDto user = userService.getUserByEmail(email);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            System.out.println("Error al obtener usuario por email: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PatchMapping("/me")
    public ResponseEntity<Void> updateCurrentUserProfile(
            @RequestHeader("Authorization") String token,
            @RequestBody UpdateUserProfileDto dto) {
        try {
            UserInfoDto userInfo = authClient.validateUserToken(token.replace("Bearer ", "")).block();
            if (userInfo == null || userInfo.getUseremail() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            UserProfileDto userProfile = userService.getUserProfileByEmail(userInfo.getUseremail());
            userService.updateUserProfileReactively(userProfile.getId(), dto);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.out.println("Excepción al actualizar el perfil: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/transfer")
    public ResponseEntity<Void> transferCredits(
            @RequestParam("fromUserId") Long fromUserId,
            @RequestParam("toUserId") Long toUserId,
            @RequestParam("amount") int amount,
            @RequestHeader("Authorization") String token) {
        try {
            UserInfoDto userInfo = authClient.validateUserToken(token.replace("Bearer ", "")).block();
            if (userInfo == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            if (!userInfo.getId().equals(fromUserId) && !userInfo.getId().equals(toUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            userService.transferCredits(fromUserId, toUserId, amount);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.out.println("Error al transferir créditos: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{id}/location")
    public ResponseEntity<User> updateLocation(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        try {
            Double latitude = Double.valueOf(payload.get("latitude").toString());
            Double longitude = Double.valueOf(payload.get("longitude").toString());
            String locationName = payload.get("locationName").toString();
            User updatedUser = userService.updateLocation(id, latitude, longitude, locationName);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            System.out.println("Error al actualizar ubicación: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/get-by-location/{location}")
    public ResponseEntity<List<User>> getUsersFromLocation(@PathVariable String location) {
        try {
            List<User> users = userService.getUsersByLocation(location);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            System.out.println("Error al obtener usuarios por ubicación: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/all-with-location")
    public ResponseEntity<List<UserLocationDto>> getAllUsersWithLocation(@RequestHeader("Authorization") String token) {
        try {
            UserInfoDto userInfo = authClient.validateUserToken(token.replace("Bearer ", "")).block();
            if (userInfo == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            List<User> users = userService.getAllUsersWithLocation();
            List<UserLocationDto> userDtos = users.stream()
                    .map(user -> new UserLocationDto(user.getId(), user.getLatitude(), user.getLongitude()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(userDtos);
        } catch (Exception e) {
            System.out.println("Error al obtener usuarios con ubicación: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/by-username/{username}")
    public ResponseEntity<UserProfileDto> getUserByUsername(
            @PathVariable String username,
            @RequestHeader("Authorization") String token) {
        try {
            UserInfoDto userInfo = authClient.validateUserToken(token.replace("Bearer ", "")).block();
            if (userInfo == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            UserProfileDto profileDto = userService.getUserByUsername(username);
            return ResponseEntity.ok(profileDto);
        } catch (Exception e) {
            System.out.println("Error al obtener el perfil por username: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}