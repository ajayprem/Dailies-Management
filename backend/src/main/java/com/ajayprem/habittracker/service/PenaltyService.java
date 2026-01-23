package com.ajayprem.habittracker.service;

import java.util.*;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ajayprem.habittracker.dto.PenaltyDto;
import com.ajayprem.habittracker.dto.PenaltySummaryDto;
import com.ajayprem.habittracker.dto.UserOwedDto;
import com.ajayprem.habittracker.model.Penalty;
import com.ajayprem.habittracker.repository.PenaltyRepository;

@Service
public class PenaltyService {

    private static final Logger log = LoggerFactory.getLogger(PenaltyService.class);

    @Autowired
    private PenaltyRepository penaltyRepository;

    public List<Penalty> getPenaltiesEntities(Long userId) {
        log.info("getPenaltiesEntities: userId={}", userId);
        return penaltyRepository.findByFromUserIdOrToUserId(userId, userId);
    }

    public PenaltySummaryDto getPenaltySummary(Long userId) {
        log.info("getPenaltySummary: uid={}", userId);
        List<Penalty> list = getPenaltiesEntities(userId);
        List<PenaltyDto> penalty = new ArrayList<>();
        Map<String, UserOwedDto> paymentMap = new HashMap<>();
        double totalOwed = 0, totalReceived = 0;
        for (Penalty p : list) {
            PenaltyDto dto = getPenaltyDto(p);
            if (dto.getFromUserId() == userId) {
                paymentMap.computeIfAbsent(dto.getToUser(), x -> new UserOwedDto(p.getToUser().getId(),
                        p.getToUser().getName(), p.getToUser().getEmail(), 0.0)).addAmount(dto.getAmount());
                totalOwed += dto.getAmount();
            } else {
                paymentMap.computeIfAbsent(dto.getFromUser(), x -> new UserOwedDto(p.getFromUser().getId(),
                        p.getFromUser().getName(), p.getFromUser().getEmail(), 0.0)).addAmount(-dto.getAmount());
                totalReceived += dto.getAmount();
            }
            penalty.add(dto);
        }
        List<UserOwedDto> owedMap = paymentMap.entrySet().stream().filter(x -> x.getValue().getAmount() > 0)
                .map(Map.Entry::getValue)
                .collect(Collectors.toList());
        PenaltySummaryDto out = new PenaltySummaryDto();
        out.setPenalties(penalty);
        out.setOwedList(owedMap);
        out.setTotalOwed(totalOwed);
        out.setTotalReceived(totalReceived);
        return out;
    }

    private static PenaltyDto getPenaltyDto(Penalty p) {
        PenaltyDto dto = new PenaltyDto();
        dto.setId(String.valueOf(p.getId()));
        dto.setType(p.getType());
        dto.setTaskId(p.getTask() != null ? String.valueOf(p.getTask().getId()) : null);
        dto.setFromUser(p.getFromUser() != null ? String.valueOf(p.getFromUser().getName()) : null);
        dto.setFromUserId(p.getFromUser() != null ? p.getFromUser().getId() : null);
        dto.setToUser(p.getToUser() != null ? String.valueOf(p.getToUser().getName()) : null);
        dto.setToUserId(p.getToUser() != null ? p.getToUser().getId() : null);
        dto.setAmount(p.getAmount());
        dto.setReason(p.getReason());
        dto.setCreatedAt(p.getCreatedAt());
        dto.setPeriodKey(p.getPeriodKey());
        return dto;
    }

    public boolean removePenalties(Long fromUserId, Long toUserId) {
        try {

           List<Penalty> existing = penaltyRepository.findByFromUserIdAndToUserId(fromUserId, toUserId);
                        for (Penalty penalty : existing) {
                            penaltyRepository.delete(penalty);
                            log.info("removePenalties: removed penalty fromUserId={} toUserId={}", fromUserId, toUserId);
                        }
            return true;
        } catch (Exception e) {
            log.error("removePenalties: error deleting penalties fromUserId={} toUserId={}", fromUserId, toUserId, e);
            return false;
        }
    }

}