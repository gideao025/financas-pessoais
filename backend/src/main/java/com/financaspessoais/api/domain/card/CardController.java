package com.financaspessoais.api.domain.card;

import jakarta.validation.Valid;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cards")
@RequiredArgsConstructor
public class CardController {

  private final CardService cardService;
  private final CardInvoiceService cardInvoiceService;

  @GetMapping
  public List<CardResponse> listMine() {
    return cardService.listMine();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public CardResponse create(@Valid @RequestBody CardRequest request) {
    return cardService.create(request);
  }

  @PutMapping("/{id}")
  public CardResponse update(@PathVariable UUID id, @Valid @RequestBody CardRequest request) {
    return cardService.update(id, request);
  }

  @PostMapping("/{id}/toggle-block")
  public CardResponse toggleBlocked(@PathVariable UUID id) {
    return cardService.toggleBlocked(id);
  }

  @GetMapping("/{id}/invoice/current")
  public InvoiceResponse currentInvoice(@PathVariable UUID id) {
    return cardInvoiceService.getCurrentInvoice(id);
  }

  @GetMapping("/{id}/invoice")
  public InvoiceResponse invoice(@PathVariable UUID id, @RequestParam String month) {
    return cardInvoiceService.getInvoice(id, YearMonth.parse(month));
  }
}
