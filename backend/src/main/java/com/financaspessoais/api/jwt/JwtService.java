package com.financaspessoais.api.jwt;

import com.financaspessoais.api.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import javax.crypto.SecretKey;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JwtService {

  private final AppProperties properties;

  public String generateAccessToken(String subject) {
    return generateToken(subject, properties.accessExpirationMs(), Map.of("type", "access"));
  }

  public String generateRefreshToken(String subject) {
    return generateToken(subject, properties.refreshExpirationMs(), Map.of("type", "refresh"));
  }

  public String extractSubject(String token) {
    try {
      return parseClaims(token).getSubject();
    } catch (Exception ex) {
      return null;
    }
  }

  public boolean isTokenValid(String token, String subject) {
    try {
      Claims claims = parseClaims(token);
      return subject.equals(claims.getSubject()) && claims.getExpiration().after(new Date());
    } catch (Exception ex) {
      return false;
    }
  }

  private String generateToken(String subject, long expirationMs, Map<String, Object> extraClaims) {
    Instant now = Instant.now();
    return Jwts.builder()
        .claims(extraClaims)
        .subject(subject)
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plusMillis(expirationMs)))
        .signWith(signingKey())
        .compact();
  }

  private Claims parseClaims(String token) {
    return Jwts.parser()
        .verifyWith(signingKey())
        .build()
        .parseSignedClaims(token)
        .getPayload();
  }

  private SecretKey signingKey() {
    return Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
  }
}
