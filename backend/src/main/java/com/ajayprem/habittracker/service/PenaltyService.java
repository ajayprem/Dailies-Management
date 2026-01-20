package com.ajayprem.habittracker.service;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ajayprem.habittracker.dto.PenaltyDto;
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

    public List<PenaltyDto> getPenalties(Long uid) {
        log.info("getPenalties: uid={}", uid);
        List<Penalty> list = getPenaltiesEntities(uid);
        List<PenaltyDto> out = new ArrayList<>();
        for (Penalty p : list) {
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
            out.add(dto);
        }
        return out;
    }

    
}